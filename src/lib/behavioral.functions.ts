// Behavioral events: per-user pseudonymous event stream (§13 source).
// Insert via trackEvent; aggregate via getBehavioralProfile.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const TrackInput = z.object({
  kind: z.string().min(1).max(80),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export const trackEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TrackInput.parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from('behavioral_events').insert({
      user_id: context.userId,
      kind: data.kind,
      payload: (data.payload ?? {}) as never,
    })
    return { ok: true }
  })

export type BehavioralProfile = {
  events_total: number
  visits: number
  dwell: number
  loves: number
  frictions: number
  sentiment: number // 0..100 (love share)
  questions: number
  last_question: string | null
  top_action: string | null
  top_action_label: string | null
}

const ACTION_LABEL: Record<string, string> = {
  relate: 'feeling less alone',
  react: 'reaching toward someone',
  scan_done: 'checking in on yourself',
  spill_completed: 'saying it out loud',
  room_created: 'saying it out loud',
  journal_created: 'turning inward',
  comment_post: 'showing up for others',
  mirror_open: 'looking inward',
  mirror_reading: 'looking inward',
  mirror_session_turn: 'sitting with yourself',
  room_dwell_long: 'sitting with stories that land',
  return_visit: 'finding your way back',
}

export const getBehavioralProfile = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BehavioralProfile> => {
    const { data: rows, error } = await context.supabase
      .from('behavioral_events')
      .select('kind, payload, created_at')
      .eq('user_id', context.userId)
      .order('created_at', { ascending: false })
      .limit(1000)
    if (error) throw new Error(error.message)
    const events = rows ?? []
    const counts: Record<string, number> = {}
    let visits = 0, dwell = 0, loves = 0, frictions = 0, questions = 0
    let lastQuestion: string | null = null
    for (const e of events) {
      counts[e.kind] = (counts[e.kind] ?? 0) + 1
      if (e.kind === 'session_start' || e.kind === 'return_visit') visits++
      if (e.kind === 'room_dwell_long') dwell++
      if (e.kind === 'love' || e.kind === 'relate' || e.kind === 'react' || e.kind === 'scan_done' || e.kind === 'spill_completed') loves++
      if (e.kind === 'friction' || e.kind === 'room_quick_exit') frictions++
      if (e.kind === 'companion_question') {
        questions++
        if (!lastQuestion) {
          const p = e.payload as { text?: string } | null
          if (p?.text) lastQuestion = String(p.text).slice(0, 200)
        }
      }
    }
    // top_action = the love-type event most done
    const loveKinds = ['relate', 'react', 'scan_done', 'spill_completed', 'room_created', 'comment_post', 'mirror_open', 'room_dwell_long', 'return_visit', 'journal_created', 'mirror_reading']
    let topAction: string | null = null
    let topN = 0
    for (const k of loveKinds) {
      const n = counts[k] ?? 0
      if (n > topN) { topN = n; topAction = k }
    }
    const sentiment = loves + frictions > 0 ? Math.round((loves / (loves + frictions)) * 100) : 0
    return {
      events_total: events.length,
      visits,
      dwell,
      loves,
      frictions,
      sentiment,
      questions,
      last_question: lastQuestion,
      top_action: topAction,
      top_action_label: topAction ? (ACTION_LABEL[topAction] || topAction.replace(/_/g, ' ')) : null,
    }
  })
