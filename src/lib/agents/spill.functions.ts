// The Spill orchestrator. Chains Scrubber → Guard → Scan → Matcher → Companion.
// Persists the situation if the user is authenticated; runs ephemeral otherwise.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

import { runScrub } from './scrubber.functions'
import { runClassifyCrisis } from './guard.functions'
import { scanIntensity, bandFor } from './scan.functions'
import { findMatches } from './matcher.functions'
import { runCompanion } from './companion.functions'
import { CRISIS_COPY } from './constitution'

const SpillInput = z.object({
  raw: z.string().min(1).max(8000),
  pillar: z.enum(['relationships', 'marriage', 'family', 'career']).default('relationships'),
  is_public: z.boolean().default(true),
  alias: z.string().optional(),
})

export type SpillPayoff = {
  situation_id: string | null
  clean_text: string
  scan: number | null
  band: string | null
  reflection: string | null
  notice: string
  resonance_line: string
  matched_count: number
  matched_display_count: number | null  // honest count for UI; null = don't show a number
  matched_stories: { id: string; excerpt: string }[]
  companion_message: string
  crisis: boolean
}

export const runSpill = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SpillInput.parse(data))
  .handler(async ({ data, context }): Promise<SpillPayoff> => {
    // 1. Scrubber
    const scrub = await runScrub(data.raw)

    // 2. Guard
    const guard = await runClassifyCrisis(scrub.clean_text)

    if (guard.crisis) {
      // Persona drops; no Scan reveal, no matcher, no payoff gamification.
      // Record a private situation + crisis_event via admin client.
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      const { data: sit } = await supabaseAdmin
        .from('situations')
        .insert({
          alias_id: context.userId,
          pillar: data.pillar,
          clean_text: scrub.clean_text,
          crisis_flag: true,
          is_public: false,
        })
        .select('id')
        .single()
      if (sit?.id) {
        await supabaseAdmin.from('crisis_events').insert({
          alias_id: context.userId,
          situation_id: sit.id,
          category: guard.category,
          severity: guard.severity,
        })
      }
      return {
        situation_id: sit?.id ?? null,
        clean_text: scrub.clean_text,
        scan: null, band: null, reflection: null,
        notice: scrub.notice,
        resonance_line: '',
        matched_count: 0,
        matched_display_count: null,
        matched_stories: [],
        companion_message: CRISIS_COPY,
        crisis: true,
      }
    }

    // 3. Scan
    const scan = await scanIntensity({
      data: { clean_text: scrub.clean_text, pillar: data.pillar },
    })

    // 4. Matcher — pgvector cosine over real, public corpus; honest count
    const match = await findMatches({
      data: { pillar: data.pillar, query_text: scrub.clean_text, tags: [] },
    })

    // 5. Persist situation (owner-scoped)
    const { data: sit } = await context.supabase
      .from('situations')
      .insert({
        alias_id: context.userId,
        pillar: data.pillar,
        clean_text: scrub.clean_text,
        initial_scan: scan.scan,
        scan_band: scan.band,
        reflection: scan.reflection,
        is_public: data.is_public,
      })
      .select('id')
      .single()

    if (sit?.id && scrub.replacements.length) {
      await context.supabase.from('pii_scrub_log').insert(
        scrub.replacements.map((r) => ({
          situation_id: sit.id,
          alias_id: context.userId,
          detected_type: r.detected_type,
          replacement_token: r.replacement_token,
          count: r.count,
        })),
      )
    }

    // 5a. Embed the situation for future cosine matching (fail-soft).
    if (sit?.id) {
      try {
        const { embedText, toVectorLiteral } = await import('./embeddings.server')
        const vec = await embedText(scrub.clean_text)
        if (vec) {
          await context.supabase
            .from('situations')
            .update({ embedding: toVectorLiteral(vec) } as never)
            .eq('id', sit.id)
        }
      } catch { /* embedding is non-blocking */ }
    }

    // 5b. Schedule the day0..day14 check-in cadence
    if (sit?.id) {
      const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
      await supabaseAdmin.rpc('schedule_checkins', {
        p_situation_id: sit.id,
        p_alias_id: context.userId,
      })
    }

    // 5c. Mirror ingest — fire-and-forget; never blocks the spill payoff.
    if (sit?.id) {
      try {
        const { runIngestMirrorEvent } = await import('@/lib/mirror-pipeline.functions')
        void runIngestMirrorEvent({
          supabase: context.supabase,
          userId: context.userId,
          data: {
            source: 'spill',
            ref_id: sit.id,
            raw_text: scrub.clean_text,
            district_hint: data.pillar === 'career' ? 'career'
              : data.pillar === 'family' ? 'family'
              : data.pillar === 'marriage' ? 'love'
              : 'love',
          },
        })
      } catch { /* never block the user flow */ }
    }

    // 6. Companion — active felt-heard
    const companion = await runCompanion({
      data: {
        mode: 'felt_heard',
        crisis_flag: false,
        alias: data.alias,
        messages: [{ role: 'user', content: scrub.clean_text }],
        context: {
          pillar: data.pillar,
          scan: scan.scan,
          scan_band: scan.band,
          reflection: scan.reflection,
          resonance_line: match.resonance_line,
          matched_excerpts: match.stories.map((s) => s.excerpt),
        },
      },
    })

    return {
      situation_id: sit?.id ?? null,
      clean_text: scrub.clean_text,
      scan: scan.scan,
      band: scan.band,
      reflection: scan.reflection,
      notice: scrub.notice,
      resonance_line: match.resonance_line,
      matched_count: match.count,
      matched_display_count: match.display_count,
      matched_stories: match.stories.map((s) => ({ id: s.id, excerpt: s.excerpt })),
      companion_message: companion.text,
      crisis: false,
    }
  })
