// Mirror collection pipeline. One fire-and-forget server fn the rest of
// the app calls when a user emits a signal (spill / scan / comment / like /
// follow / browse). Idempotent on (user_id, source, ref_id).
//
//   event -> scrub -> embed -> match against THIS user's mirror_patterns
//     match    -> deepen (sources++, count, depth, trend, last_seen)
//     no match -> reading -> insert new pattern (cap 40 active)
//   -> punch (persist, never blank) -> append mirror_signals row
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { scrubText } from './agents/scrubber.functions'
import { embedText, toVectorLiteral } from './agents/embeddings.server'
import { runMirrorReading, runMirrorPunch } from './agents/mirror.functions'
import {
  type District,
  normalizeDistrict,
} from './agents/mirror-guards'

const ACTIVE_CAP = 40

const Source = z.enum(['spill', 'scan', 'comments', 'likes', 'follows', 'browse'])
type SourceT = z.infer<typeof Source>

const IngestInput = z.object({
  source: Source,
  ref_id: z.string().min(1).max(120),
  raw_text: z.string().max(8000).default(''),
  district_hint: z.string().optional(),
})

type PatternRow = {
  id: string
  user_id: string
  name: string
  district: District
  count: number
  depth: number
  trend: number[]
  sources: Record<string, number>
  embedding: string | null
  insight: string | null
  last_seen: string
}

function depthFor(count: number): number {
  if (count < 10) return 1
  if (count < 25) return 2
  if (count < 60) return 3
  if (count < 120) return 4
  return 5
}

function pushTrend(trend: number[]): number[] {
  // simple weekly-bucket increment of the latest slot.
  const arr = (Array.isArray(trend) && trend.length === 7 ? [...trend] : [0, 0, 0, 0, 0, 0, 0]).map(Number)
  arr[6] = (arr[6] ?? 0) + 1
  return arr
}

function trendDir(trend: number[]): 'rising' | 'steady' | 'cooling' | 'dormant' {
  const a = trend ?? []
  const last = a[6] ?? 0
  const prev = a[5] ?? 0
  const prev2 = a[4] ?? 0
  if (last > prev && prev >= prev2) return 'rising'
  if (last < prev) return 'cooling'
  return 'steady'
}

export const ingestMirrorEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => IngestInput.parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true; pattern_id: string | null }> => {
    const userId = context.userId
    const supabase = context.supabase

    // idempotency: skip if we already ingested this (user, source, ref_id)
    {
      const { data: existing } = await supabase
        .from('mirror_signals')
        .select('id, pattern_id')
        .eq('user_id', userId)
        .eq('source', data.source)
        .eq('ref_id', data.ref_id)
        .maybeSingle()
      if (existing) return { ok: true, pattern_id: (existing.pattern_id as string) ?? null }
    }

    // 1. scrub (cheap regex+LLM; text may be empty for browse/follow signals)
    let cleaned = ''
    if (data.raw_text.trim()) {
      try {
        const s = await scrubText({ data: { raw: data.raw_text.slice(0, 4000) } })
        cleaned = s.clean_text ?? ''
      } catch { cleaned = data.raw_text.slice(0, 4000) }
    }

    // 2. embed (fail-soft)
    const embeddingText = cleaned || `${data.source} signal`
    const vec = await embedText(embeddingText)
    const vecLiteral = vec ? toVectorLiteral(vec) : null

    // 3. match nearest existing pattern for THIS user
    let matched: { id: string; similarity: number } | null = null
    if (vecLiteral) {
      const { data: hits } = await supabase.rpc('match_user_patterns', {
        p_user: userId,
        q: vecLiteral as unknown as never,
        match_count: 1,
        similarity_floor: 0.78,
      })
      if (Array.isArray(hits) && hits[0]) matched = { id: hits[0].id, similarity: hits[0].similarity }
    }

    let patternId: string | null = null

    if (matched) {
      // ---- DEEPEN ----
      const { data: row } = await supabase
        .from('mirror_patterns')
        .select('id, user_id, name, district, count, depth, trend, sources, embedding, insight, last_seen')
        .eq('id', matched.id)
        .single()
      if (!row) return { ok: true, pattern_id: null }
      const p = row as unknown as PatternRow
      const nextSources = { ...(p.sources ?? {}) } as Record<SourceT, number>
      nextSources[data.source] = (nextSources[data.source] ?? 0) + 1
      const nextCount = Object.values(nextSources).reduce((a, b) => a + Number(b || 0), 0)
      const nextTrend = pushTrend(p.trend)
      const beforeDepth = p.depth
      const nextDepth = depthFor(nextCount)
      const update: Record<string, unknown> = {
        sources: nextSources,
        count: nextCount,
        depth: nextDepth,
        trend: nextTrend,
        trend_dir: trendDir(nextTrend),
        last_seen: new Date().toISOString(),
        state: 'active',
      }
      // refresh punch on depth-tier jumps so the hero line evolves
      if (nextDepth > beforeDepth) {
        try {
          const punch = await runMirrorPunch({
            data: {
              name: p.name,
              district: p.district,
              count: nextCount,
              depth: nextDepth,
              sources: nextSources as Record<string, number>,
              trend: nextTrend,
              insight: p.insight ?? '',
            },
          })
          update.punch = punch.punch
          update.record = punch.record
        } catch { /* keep existing punch */ }
      }
      await supabase.from('mirror_patterns').update(update as never).eq('id', matched.id)
      patternId = matched.id
    } else {
      // ---- CRYSTALLIZE (respect active cap) ----
      const { count: activeCount } = await supabase
        .from('mirror_patterns')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('state', 'active')
      if ((activeCount ?? 0) >= ACTIVE_CAP) {
        // at cap; record the signal unattached so the cross-read still sees it
        await supabase.from('mirror_signals').insert({
          user_id: userId,
          source: data.source,
          ref_id: data.ref_id,
          text_scrubbed: cleaned,
          embedding: vecLiteral as never,
        } as never)
        return { ok: true, pattern_id: null }
      }
      let reading
      try {
        reading = await runMirrorReading({
          data: {
            scrubbed_text: cleaned || `signal of type ${data.source}`,
            district_hint: data.district_hint,
          },
        })
      } catch {
        reading = null
      }
      if (!reading) return { ok: true, pattern_id: null }
      const district = normalizeDistrict(reading.trait.district)
      const initialSources: Record<SourceT, number> = {
        spill: 0, scan: 0, comments: 0, likes: 0, follows: 0, browse: 0,
      }
      initialSources[data.source] = 1
      const initialTrend = [0, 0, 0, 0, 0, 0, 1]
      const insertRow: Record<string, unknown> = {
        user_id: userId,
        is_demo: false,
        name: reading.trait.name,
        emoji: reading.trait.emoji,
        district,
        rarity: reading.trait.rarity,
        insight: reading.trait.insight,
        punch: reading.burn,
        record: reading.filed,
        count: 1,
        depth: 1,
        trend: initialTrend,
        trend_dir: 'rising',
        sources: initialSources,
        embedding: vecLiteral as never,
      }
      const { data: inserted } = await supabase
        .from('mirror_patterns')
        .insert(insertRow as never)
        .select('id, name, district, count, depth, sources, trend, insight')
        .single()
      if (inserted) {
        patternId = (inserted as { id: string }).id
        // generate a polished punch (replaces burn) — persisted; rendering is DB-read
        try {
          const punch = await runMirrorPunch({
            data: {
              name: (inserted as { name: string }).name,
              district,
              count: 1,
              depth: 1,
              sources: initialSources as Record<string, number>,
              trend: initialTrend,
              insight: reading.trait.insight,
            },
          })
          await supabase
            .from('mirror_patterns')
            .update({ punch: punch.punch, record: punch.record } as never)
            .eq('id', patternId)
        } catch { /* keep crystallization burn */ }
      }
    }

    // append provenance
    await supabase.from('mirror_signals').insert({
      user_id: userId,
      pattern_id: patternId,
      source: data.source,
      ref_id: data.ref_id,
      text_scrubbed: cleaned,
      embedding: vecLiteral as never,
    } as never)

    return { ok: true, pattern_id: patternId }
  })

// ----- read helpers used by render layer -----

export const listMirrorPatterns = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from('mirror_patterns')
      .select('id, name, emoji, district, rarity, state, insight, punch, record, count, depth, trend, trend_dir, sources, first_seen, last_seen')
      .eq('user_id', context.userId)
      .eq('is_demo', false)
      .order('last_seen', { ascending: false })
      .limit(60)
    return data ?? []
  })

export const listDemoPatterns = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data } = await sb
      .from('mirror_patterns')
      .select('id, name, emoji, district, rarity, state, insight, punch, record, count, depth, trend, trend_dir, sources, first_seen, last_seen')
      .eq('is_demo', true)
      .order('count', { ascending: false })
      .limit(20)
    return data ?? []
  })
