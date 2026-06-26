// The Matcher — resonance retrieval. MVP: pillar + tag overlap on public, non-crisis situations.
// Returns a truthful "N people lived a version of this" count and up to 2 matched stories.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export type MatchedStory = {
  id: string
  alias_id: string
  pillar: string
  excerpt: string
  scan: number | null
}

export type MatcherResult = {
  count: number
  stories: MatchedStory[]
  resonance_line: string
}

const MatcherInput = z.object({
  pillar: z.enum(['relationships', 'marriage', 'family', 'career']),
  tags: z.array(z.string()).default([]),
  exclude_id: z.string().uuid().optional(),
})

function getServerClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  )
}

export const findMatches = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => MatcherInput.parse(data))
  .handler(async ({ data }): Promise<MatcherResult> => {
    const supabase = getServerClient()
    let query = supabase
      .from('situations')
      .select('id, alias_id, pillar, clean_text, initial_scan, tags')
      .eq('pillar', data.pillar)
      .eq('is_public', true)
      .eq('crisis_flag', false)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data.exclude_id) query = query.neq('id', data.exclude_id)

    const { data: rows, error } = await query
    if (error || !rows) return { count: 0, stories: [], resonance_line: 'you might be the first to put this here — that takes guts.' }

    // Rank by tag overlap when available, else recency
    const ranked = rows
      .map((r) => {
        const overlap = data.tags.length
          ? (r.tags ?? []).filter((t: string) => data.tags.includes(t)).length
          : 0
        return { row: r, overlap }
      })
      .sort((a, b) => b.overlap - a.overlap)

    const top = ranked.slice(0, 2).map(({ row }): MatchedStory => ({
      id: row.id,
      alias_id: row.alias_id,
      pillar: row.pillar,
      excerpt: (row.clean_text ?? '').slice(0, 220),
      scan: row.initial_scan,
    }))

    const count = rows.length
    const resonance_line =
      count >= 50 ? `you're not the only one — ${count}+ people lived a version of this.`
      : count >= 5 ? `you're not the only one — ${count} people lived a version of this.`
      : count >= 1 ? `a few others have sat with something like this. you're not weird.`
      : `you might be the first to put this here — that takes guts.`

    return { count, stories: top, resonance_line }
  })
