// Nightly Mirror evolution job — recomputes depth, trend_dir, ruin state.
// Called by pg_cron via the apikey-protected public hook.
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/mirror-evolution')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get('apikey')
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY
        if (!expected || apikey !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { error } = await supabaseAdmin.rpc('recompute_mirror_evolution', { _decay_days: 30 })
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ ok: true })
      },
    },
  },
})
