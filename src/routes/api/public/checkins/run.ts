// Phase 3a — Server scheduler.
// Cron (pg_cron, every minute) POSTs to this endpoint. We claim due
// check-ins, dispatch them (email via Resend; 'eye' = in-app only), and
// mark them sent/failed. Idempotent because the update guard requires
// state='scheduled'.
import { createFileRoute } from '@tanstack/react-router'

const MAX_PER_RUN = 200
const MAX_ATTEMPTS = 3

export const Route = createFileRoute('/api/public/checkins/run')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // The /api/public/* prefix bypasses platform auth on published
        // sites; we still require the publishable apikey so pg_cron is
        // the only caller in practice.
        const apikey = request.headers.get('apikey') || ''
        if (apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response('unauthorized', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { sendCheckinEmail } = await import('@/lib/email.server')

        const appOrigin = new URL(request.url).origin

        const { data: due } = await supabaseAdmin
          .from('checkins')
          .select('id, situation_id, alias_id, type, channel, attempts')
          .eq('state', 'scheduled')
          .lte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(MAX_PER_RUN)

        const rows = due ?? []
        let sent = 0
        let failed = 0
        let skipped = 0

        for (const row of rows) {
          const attempts = ((row.attempts as number) ?? 0) + 1

          // Resolve recipient email when channel = email.
          let to: string | null = null
          let suppressed = false
          if (row.channel === 'email') {
            const { data: alias } = await supabaseAdmin
              .from('aliases')
              .select('user_id, notif_email, notif_email_opt_in, email_suppressed')
              .eq('user_id', row.alias_id as string)
              .maybeSingle()
            if (alias) {
              suppressed = !!alias.email_suppressed || !alias.notif_email_opt_in
              if (!suppressed) {
                to = (alias.notif_email as string | null) ?? null
                if (!to) {
                  const { data: u } = await supabaseAdmin.auth.admin.getUserById(alias.user_id as string)
                  to = u.user?.email ?? null
                }
              }
            }
          }


          let ok = true
          let err: string | null = null

          if (row.channel === 'email') {
            if (suppressed) {
              ok = true // honor opt-out: mark sent without dispatch
            } else if (!to) {
              ok = false; err = 'no email on file'
            } else {
              const r = await sendCheckinEmail({
                to,
                type: row.type as 'day1' | 'day2' | 'day3' | 'day7' | 'day14' | 'day0',
                situationId: row.situation_id as string,
                appOrigin,
              })
              ok = r.ok; err = r.error ?? null
            }
          } // else channel === 'eye' — in-app only; mark sent immediately


          if (ok) {
            await supabaseAdmin
              .from('checkins')
              .update({ state: 'sent', sent_at: new Date().toISOString(), attempts, last_error: null })
              .eq('id', row.id as string)
              .eq('state', 'scheduled')
            sent++
          } else if (attempts >= MAX_ATTEMPTS) {
            await supabaseAdmin
              .from('checkins')
              .update({ state: 'failed', attempts, last_error: err })
              .eq('id', row.id as string)
              .eq('state', 'scheduled')
            failed++
          } else {
            // leave as scheduled for next tick; just record the attempt
            await supabaseAdmin
              .from('checkins')
              .update({ attempts, last_error: err })
              .eq('id', row.id as string)
              .eq('state', 'scheduled')
            skipped++
          }
        }

        return Response.json({ processed: rows.length, sent, failed, retry: skipped })
      },

      // Allow GET as a no-op health probe so it's easy to curl.
      GET: async () => Response.json({ ok: true, name: 'checkins.run' }),
    },
  },
})
