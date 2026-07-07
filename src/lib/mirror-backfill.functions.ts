// Backfill the current user's Mirror from their existing situations + comments.
// Sequential (LLM heavy per item), capped per invocation. The underlying
// pipeline is idempotent on (user_id, source, ref_id), so repeated calls
// safely skip already-ingested rows.
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { runIngestMirrorEvent } from '@/lib/mirror-pipeline.functions'

const PER_INVOCATION_CAP = 50

type Pillar = 'career' | 'family' | 'marriage' | 'relationships' | string | null | undefined
function districtFromPillar(p: Pillar): string {
  if (p === 'career') return 'career'
  if (p === 'family') return 'family'
  if (p === 'marriage') return 'love'
  return 'love'
}

export const backfillMyMirror = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ processed: number; remaining: number }> => {
    const supabase = context.supabase
    const userId = context.userId

    // Load user's own situations (non-deleted) and their comments.
    const { data: sits, error: sitErr } = await supabase
      .from('situations')
      .select('id, pillar, kind, clean_text, body, title')
      .eq('alias_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(500)
    if (sitErr) console.error('[mirror-backfill] situations select', sitErr)

    const { data: cmts, error: cmtErr } = await supabase
      .from('comment_records')
      .select('id, clean_text')
      .eq('author_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(500)
    if (cmtErr) console.error('[mirror-backfill] comments select', cmtErr)

    type Item = { source: 'spill' | 'scan' | 'comments'; ref_id: string; raw_text: string; district_hint: string }
    const items: Item[] = []
    for (const s of (sits ?? []) as Array<{ id: string; pillar: Pillar; kind: string | null; clean_text: string | null; body: string | null; title: string | null }>) {
      items.push({
        source: s.kind === 'scan' ? 'scan' : 'spill',
        ref_id: s.id,
        raw_text: (s.clean_text || s.body || s.title || '').toString(),
        district_hint: districtFromPillar(s.pillar),
      })
    }
    for (const c of (cmts ?? []) as Array<{ id: string; clean_text: string | null }>) {
      items.push({
        source: 'comments',
        ref_id: c.id,
        raw_text: (c.clean_text || '').toString(),
        district_hint: 'social',
      })
    }

    // Skip items already ingested for this user (belt-and-suspenders on top of
    // the pipeline's own dedupe select). This keeps the per-invocation cap
    // pointed at actually-new work.
    const { data: signals, error: sigErr } = await supabase
      .from('mirror_signals')
      .select('source, ref_id')
      .eq('user_id', userId)
    if (sigErr) console.error('[mirror-backfill] signals select', sigErr)
    const seen = new Set<string>()
    for (const r of (signals ?? []) as Array<{ source: string; ref_id: string }>) {
      seen.add(`${r.source}::${r.ref_id}`)
    }
    const pending = items.filter((i) => !seen.has(`${i.source}::${i.ref_id}`))

    const batch = pending.slice(0, PER_INVOCATION_CAP)
    let processed = 0
    for (const it of batch) {
      try {
        await runIngestMirrorEvent({ supabase, userId, data: it })
        processed++
      } catch (err) {
        console.error('[mirror-backfill] ingest', it.source, it.ref_id, err)
      }
    }

    return { processed, remaining: Math.max(0, pending.length - processed) }
  })
