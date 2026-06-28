// Mirror — real per-user memory engine. Aggregates the caller's situations
// + check-in responses into a longitudinal portrait. Auth-only; RLS scopes
// rows to alias_id = auth.uid().
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type ScorePoint = { at: string; score: number; band: string | null }
export type MirrorPortrait = {
  spill_count: number
  scan_count: number
  total_entries: number
  first_seen_at: string | null
  last_seen_at: string | null
  top_pillar: string | null
  pillar_counts: Record<string, number>
  score_series: ScorePoint[]
  trend: 'easing' | 'rising' | 'steady' | 'forming'
  recent_themes: string[]
  checkin_trajectory: { better: number; same: number; worse: number }
  forming: boolean
}

function computeTrend(series: ScorePoint[]): MirrorPortrait['trend'] {
  if (series.length < 3) return 'forming'
  // simple linear-regression slope on the last 5 points
  const pts = series.slice(-5).map((p, i) => ({ x: i, y: p.score }))
  const n = pts.length
  const sumX = pts.reduce((a, p) => a + p.x, 0)
  const sumY = pts.reduce((a, p) => a + p.y, 0)
  const sumXY = pts.reduce((a, p) => a + p.x * p.y, 0)
  const sumXX = pts.reduce((a, p) => a + p.x * p.x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1)
  if (slope < -25) return 'easing'
  if (slope > 25) return 'rising'
  return 'steady'
}

export const getMirrorPortrait = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MirrorPortrait> => {
    const { data: sits } = await context.supabase
      .from('situations')
      .select('id, pillar, kind, initial_scan, scan_band, tags, created_at, status')
      .eq('alias_id', context.userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: true })
      .limit(500)

    const rows = sits ?? []
    const spill_count = rows.filter((r) => r.kind !== 'scan').length
    const scan_count = rows.filter((r) => r.kind === 'scan').length
    const total_entries = rows.length

    const pillar_counts: Record<string, number> = {}
    for (const r of rows) pillar_counts[r.pillar] = (pillar_counts[r.pillar] || 0) + 1
    const top_pillar =
      Object.entries(pillar_counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const score_series: ScorePoint[] = rows
      .filter((r) => typeof r.initial_scan === 'number')
      .map((r) => ({
        at: r.created_at as string,
        score: r.initial_scan as number,
        band: (r.scan_band as string) ?? null,
      }))

    const trend = computeTrend(score_series)

    const themeBag: Record<string, number> = {}
    for (const r of rows) {
      const tags = Array.isArray(r.tags) ? (r.tags as string[]) : []
      for (const t of tags) themeBag[t] = (themeBag[t] || 0) + 1
    }
    const recent_themes = Object.entries(themeBag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([t]) => t)

    // Check-in trajectory counts
    const { data: resp } = await context.supabase
      .from('checkin_responses')
      .select('trajectory')
      .eq('alias_id', context.userId)
      .limit(200)
    const checkin_trajectory = { better: 0, same: 0, worse: 0 }
    for (const r of resp ?? []) {
      const t = (r as { trajectory: string | null }).trajectory
      if (t === 'better' || t === 'same' || t === 'worse') checkin_trajectory[t]++
    }

    return {
      spill_count,
      scan_count,
      total_entries,
      first_seen_at: rows[0]?.created_at ?? null,
      last_seen_at: rows[rows.length - 1]?.created_at ?? null,
      top_pillar,
      pillar_counts,
      score_series,
      trend,
      recent_themes,
      checkin_trajectory,
      forming: total_entries < 2,
    }
  })
