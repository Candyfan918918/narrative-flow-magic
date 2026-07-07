// Nightly Mirror evolution job — recomputes depth/trend/ruin AND crystallises
// orphaned mirror_signals (rows whose in-request crystallize didn't finish
// because the serverless runtime froze after responding).
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/hooks/mirror-evolution')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get('x-cron-secret') ?? ''
        const expected = process.env.CRON_SECRET ?? ''
        if (!expected || provided.length !== expected.length || provided !== expected) {
          return new Response('Unauthorized', { status: 401 })
        }
        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
        const { error } = await supabaseAdmin.rpc('recompute_mirror_evolution', { _decay_days: 30 })
        if (error) return Response.json({ error: error.message }, { status: 500 })

        // Sweep orphaned mirror_signals (crystallise phase never landed).
        let sweep = { swept: 0, linked: 0 }
        try {
          const { sweepOrphanMirrorSignals } = await import('@/lib/mirror-pipeline.functions')
          sweep = await sweepOrphanMirrorSignals({
            supabase: supabaseAdmin,
            olderThanMinutes: 10,
            limit: 50,
          })
        } catch (err) {
          console.error('[mirror-sweep] hook', err)
        }

        return Response.json({ ok: true, sweep })
      },
    },
  },
})
