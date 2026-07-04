// Hourly cron: sends a gentle re-engagement email to users who signed up
// 24h+ ago and have not submitted a spill (situation). Idempotent via
// aliases.reengagement_email_sent_at.
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/reengagement-emails')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey')
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY
        if (!expected || apikey !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { sendEmail } = await import('@/lib/email/send.server')

        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        // Candidates: alias created 24h+ ago, never re-engaged, not suppressed
        const { data: aliases, error } = await supabaseAdmin
          .from('aliases')
          .select('user_id, display_name, email_suppressed, reengagement_email_sent_at, created_at')
          .lte('created_at', cutoff)
          .is('reengagement_email_sent_at', null)
          .limit(200)
        if (error) return Response.json({ error: error.message }, { status: 500 })

        let sent = 0
        let skipped = 0

        for (const a of aliases ?? []) {
          if (a.email_suppressed) { skipped++; continue }

          // Has this user spilled?
          const { count: spillCount } = await supabaseAdmin
            .from('situations')
            .select('id', { count: 'exact', head: true })
            .eq('alias_id', a.user_id)
          if ((spillCount ?? 0) > 0) {
            // Mark as sent so we don't reconsider — they don't need re-engagement.
            await supabaseAdmin
              .from('aliases')
              .update({ reengagement_email_sent_at: new Date().toISOString() } as never)
              .eq('user_id', a.user_id)
            skipped++; continue
          }

          const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(a.user_id)
          const email = userRes?.user?.email
          if (!email || userRes?.user?.is_anonymous) { skipped++; continue }

          const res = await sendEmail(
            'hello',
            'reengagement',
            { alias: a.display_name ?? undefined, deep_link: 'https://shutap.com' },
            email,
          )
          if (!res.ok || res.suppressed) { skipped++; continue }

          await supabaseAdmin
            .from('aliases')
            .update({ reengagement_email_sent_at: new Date().toISOString() } as never)
            .eq('user_id', a.user_id)
          sent++
        }

        return Response.json({ ok: true, sent, skipped, considered: aliases?.length ?? 0 })
      },
    },
  },
})
