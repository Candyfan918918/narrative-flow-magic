// Admin-only seed ingestion. Pipes a batch of drafts through the SAME
// organic Spill pipeline (Scrubber → Guard → Scan → Mirror ingest) so
// seeded stories are indistinguishable in structure from real user posts.
// Every record created here carries is_seed=true at every layer (situation,
// mirror_signal, any newly crystallized mirror_pattern, outcome).
//
// Seeds are excluded from Hall-of-Fame eligibility and any aggregate we
// present as a "real users said" claim. Whether they count toward the
// resonance "N people lived this" number is an open decision, left as
// TODO for downstream aggregation code — this file just tags them.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { runSpill } from '@/lib/agents/spill.functions'

const DraftPillar = z.enum(['relationships', 'marriage', 'family', 'career'])

const SeedDraft = z.object({
  raw: z.string().min(20).max(6000),
  pillar: DraftPillar,
  alias: z.string().max(40).optional(),
})

const SeedBatch = z.object({
  drafts: z.array(SeedDraft).min(1).max(25),
  is_public: z.boolean().optional().default(true),
})

async function assertAdmin(ctx: unknown): Promise<void> {
  const c = ctx as {
    supabase: { rpc: (fn: 'has_role', args: { _user_id: string; _role: 'admin' }) => PromiseLike<{ data: unknown; error: unknown }> }
    userId: string
  }
  const { data, error } = await c.supabase.rpc('has_role', { _user_id: c.userId, _role: 'admin' })
  if (error || !data) throw new Error('Forbidden')
}

export type SeedBatchResult = {
  attempted: number
  created: number
  crisis_skipped: number
  errors: number
  situations: Array<{ id: string | null; slug: string | null; pillar: string; crisis: boolean }>
}

export const runSeedBatch = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SeedBatch.parse(d))
  .handler(async ({ data, context }): Promise<SeedBatchResult> => {
    await assertAdmin(context)

    const results: SeedBatchResult['situations'] = []
    let created = 0
    let crisis = 0
    let errors = 0

    for (const draft of data.drafts) {
      try {
        const out = await runSpill({
          data: {
            raw: draft.raw,
            pillar: draft.pillar,
            alias: draft.alias,
            is_public: data.is_public,
            is_seed: true,
          },
        })
        if (out.crisis) crisis++
        else if (out.situation_id) created++

        // Look up the freshly-minted slug for admin UX.
        let slug: string | null = null
        if (out.situation_id) {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
          const { data: row } = await supabaseAdmin
            .from('situations')
            .select('slug')
            .eq('id', out.situation_id)
            .maybeSingle()
          slug = ((row as { slug?: string | null } | null)?.slug) ?? null
        }
        results.push({
          id: out.situation_id,
          slug,
          pillar: draft.pillar,
          crisis: out.crisis,
        })
      } catch (err) {
        errors++
        console.error('[seed-ingest] draft failed', err)
        results.push({ id: null, slug: null, pillar: draft.pillar, crisis: false })
      }
    }

    return {
      attempted: data.drafts.length,
      created,
      crisis_skipped: crisis,
      errors,
      situations: results,
    }
  })
