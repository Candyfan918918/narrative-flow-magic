// Cron-driven check-in dispatcher.
// - Marks due check-ins as `sent` so the floating eye picks them up.
// - Applies §3a suppression: if day1 AND day2 both unopened, suppress remaining
//   email check-ins for that situation (eye still works in-session).
// - Stops dispatching for an alias whose `email_suppressed` is true.
// - Stamps `sent_at` so the dashboard can compute coverage / cold-spill rate.
// Email delivery itself is a no-op until an email domain is configured; the
// in-session eye is the guaranteed channel.
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/dispatch-checkins')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.CRON_SECRET
        const provided = request.headers.get('x-cron-secret')
        if (!expected || provided !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const nowIso = new Date().toISOString()

        const { data: due, error } = await supabaseAdmin
          .from('checkins')
          .select('id, situation_id, alias_id, type, channel, state, scheduled_at')
          .eq('state', 'scheduled')
          .lte('scheduled_at', nowIso)
          .order('scheduled_at', { ascending: true })
          .limit(500)
        if (error) return Response.json({ error: error.message }, { status: 500 })

        let suppressed = 0
        let sent = 0

        for (const ck of due ?? []) {
          // alias-level suppression
          const { data: alias } = await supabaseAdmin
            .from('aliases')
            .select('email_suppressed, notif_email, notif_email_opt_in')
            .eq('user_id', ck.alias_id)
            .maybeSingle()
          if (alias?.email_suppressed && ck.channel === 'email') {
            await supabaseAdmin.from('checkins').update({ state: 'suppressed' }).eq('id', ck.id)
            suppressed++; continue
          }

          // §3a backoff: day1 AND day2 unopened -> suppress remaining email for this situation
          if (ck.channel === 'email' && (ck.type === 'day3' || ck.type === 'day7' || ck.type === 'day14')) {
            const { data: early } = await supabaseAdmin
              .from('checkins')
              .select('type, opened_at, responded_at, state')
              .eq('situation_id', ck.situation_id)
              .in('type', ['day1', 'day2'])
            const d1 = early?.find((c) => c.type === 'day1')
            const d2 = early?.find((c) => c.type === 'day2')
            const noTouch = (c?: { opened_at: string | null; responded_at: string | null }) =>
              !!c && !c.opened_at && !c.responded_at
            if (noTouch(d1) && noTouch(d2)) {
              await supabaseAdmin.from('checkins').update({ state: 'suppressed' }).eq('id', ck.id)
              suppressed++; continue
            }
          }

          // Mark sent (eye-aware; email send is a no-op until domain configured)
          await supabaseAdmin
            .from('checkins')
            .update({ state: 'sent', sent_at: nowIso })
            .eq('id', ck.id)
          sent++
        }

        return Response.json({ ok: true, sent, suppressed, considered: due?.length ?? 0 })
      },
    },
  },
})
