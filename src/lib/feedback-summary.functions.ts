import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export interface FeedbackSummary {
  counts: { love: number; friction: number; question: number; neutral: number; total: number }
  sentiment: number
  loved: { key: string; n: number }[]
  friction: { key: string; n: number }[]
  questions: { text: string; page: string | null; t: string }[]
  byType: { key: string; n: number }[]
  windowDays: number
}

type Row = {
  type: string
  v: string
  page: string | null
  target: string | null
  label: string | null
  text: string | null
  t: string
}

export const getFeedbackSummary = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { windowDays?: number } | undefined) => ({
    windowDays: Math.max(1, Math.min(90, input?.windowDays ?? 7)),
  }))
  .handler(async ({ data, context }): Promise<FeedbackSummary> => {
    const { supabase, userId } = context
    const { data: isAdmin, error: roleErr } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })
    if (roleErr || !isAdmin) {
      throw new Response('Forbidden', { status: 403 })
    }

    const since = new Date(Date.now() - data.windowDays * 24 * 60 * 60 * 1000).toISOString()
    const { data: rows, error } = await supabase
      .from('feedback_events')
      .select('type,v,page,target,label,text,t')
      .gte('t', since)
      .order('t', { ascending: false })
      .limit(10000)
    if (error) throw new Response(error.message, { status: 500 })

    const r = (rows ?? []) as Row[]
    const counts = { love: 0, friction: 0, question: 0, neutral: 0, total: r.length }
    const loved = new Map<string, number>()
    const friction = new Map<string, number>()
    const byType = new Map<string, number>()
    const questions: FeedbackSummary['questions'] = []

    for (const e of r) {
      if (e.v === 'love') counts.love++
      else if (e.v === 'friction') counts.friction++
      else if (e.v === 'question') counts.question++
      else counts.neutral++
      const k = e.target || e.label || e.type
      byType.set(e.type, (byType.get(e.type) ?? 0) + 1)
      if (e.v === 'love') loved.set(k, (loved.get(k) ?? 0) + 1)
      if (e.v === 'friction') friction.set(k, (friction.get(k) ?? 0) + 1)
      if (e.v === 'question' && e.text && questions.length < 40) {
        questions.push({ text: e.text, page: e.page, t: e.t })
      }
    }

    const rank = (m: Map<string, number>) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key, n]) => ({ key, n }))

    const denom = counts.love + counts.friction
    const sentiment = denom > 0 ? Math.round((counts.love / denom) * 100) : 0

    return {
      counts,
      sentiment,
      loved: rank(loved),
      friction: rank(friction),
      questions,
      byType: [...byType.entries()].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n })),
      windowDays: data.windowDays,
    }
  })
