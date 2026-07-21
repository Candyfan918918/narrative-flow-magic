// The Matcher — resonance retrieval over the REAL public corpus.
// Uses pgvector cosine similarity (via match_situations RPC) on embeddings
// produced by openai/text-embedding-3-small. Honors the spec §7.3
// "honest resonance number" rule:
//   - numeric "N lived this" only when N >= NUMERIC_FLOOR
//   - below the floor → story-based resonance line
//   - N=0 → fall back to "you might be the first" (Companion + SLA carry)
// Seed rows, crisis rows, private rows, and deleted rows are excluded by
// the SQL function — we never match against them.
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export type MatchedStory = {
  id: string
  alias_id: string
  pillar: string
  excerpt: string
  scan: number | null
  similarity?: number
}

export type MatcherResult = {
  count: number              // # of matched stories above similarity floor (real)
  display_count: number | null // numeric to show in UI; null when below NUMERIC_FLOOR
  stories: MatchedStory[]
  resonance_line: string
  has_match: boolean
}

const MatcherInput = z.object({
  pillar: z.enum(['relationships', 'marriage', 'family', 'career']),
  query_text: z.string().max(8000).default(''),
  tags: z.array(z.string()).default([]),
  exclude_id: z.string().uuid().optional(),
})

// Honesty thresholds — never lie about how many people lived this.
const NUMERIC_FLOOR = 5     // need ≥5 matches before showing a number
const SIMILARITY_FLOOR = 0.78

function getServerClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  )
}

export const findMatches = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => MatcherInput.parse(data))
  .handler(async ({ data }): Promise<MatcherResult> => {
    const supabase = getServerClient()

    // Try vector match first. Falls back to pillar+recency if no embedding
    // (e.g. AI key missing or text empty).
    let vectorMatches: Array<{ id: string; pillar: string; clean_text: string; similarity: number }> = []
    if (data.query_text && data.query_text.trim().length > 0) {
      const { embedText } = await import('./embeddings.server')
      const vec = await embedText(data.query_text)
      if (vec) {
        const { data: rows } = await supabase.rpc('match_situations', {
          query_embedding: vec as never,
          match_pillar: data.pillar,
          // Count breadth: fetch up to 500 above the similarity floor so the
          // honest resonance number reflects reality (spec §7.3, e.g. "50+
          // people"). Returned `stories` are still sliced to the top 2 below.
          match_count: 500,
          similarity_floor: SIMILARITY_FLOOR,
        } as never)
        if (Array.isArray(rows)) {
          vectorMatches = rows
            .map((r: { id: string; pillar: string; clean_text: string; similarity: number; created_at?: string }) => ({
              id: r.id,
              pillar: r.pillar,
              clean_text: r.clean_text,
              similarity: r.similarity,
            }))
            .filter((r) => !data.exclude_id || r.id !== data.exclude_id)
        }
      }
    }

    const count = vectorMatches.length
    const top = vectorMatches.slice(0, 2).map((r): MatchedStory => ({
      id: r.id,
      alias_id: '',
      pillar: r.pillar,
      excerpt: (r.clean_text ?? '').slice(0, 220),
      scan: null,
      similarity: r.similarity,
    }))

    // Honest resonance line (§7.3)
    let resonance_line: string
    let display_count: number | null = null
    if (count >= 50) {
      display_count = count
      resonance_line = `you're not the only one — ${count}+ people lived a version of this.`
    } else if (count >= NUMERIC_FLOOR) {
      display_count = count
      resonance_line = `you're not the only one — ${count} people lived a version of this.`
    } else if (count >= 1) {
      // Story-based resonance (no fabricated number)
      resonance_line = `someone went through almost exactly this. you're not weird.`
    } else {
      resonance_line = `you might be the first to put this here — that takes guts. a real person will weigh in soon.`
    }

    return {
      count,
      display_count,
      stories: top,
      resonance_line,
      has_match: count > 0,
    }
  })
