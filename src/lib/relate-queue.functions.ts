// Phase 2d — Human-relate SLA ops queue.
// Lists public, un-responded spills oldest first so the welcoming committee
// can react/comment within the launch SLA window (target 30 min per §7.6).
// Admin-only: gated by has_role(uid, 'admin').
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type RelateQueueRow = {
  situation_id: string
  room_id: string
  pillar: string
  title: string | null
  body: string
  alias: string
  emoji: string
  support: 'heard' | 'advice'
  hall: string
  created_at: string
  minutes_open: number
  past_sla: boolean
}

const ListInput = z.object({
  pillar: z.enum(['relationships', 'marriage', 'family', 'career']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
})

async function assertAdmin(supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null }> }, userId: string) {
  const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })
  if (!isAdmin) throw new Error('forbidden')
}

export const listRelateQueue = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data, context }): Promise<{ rows: RelateQueueRow[]; sla_minutes: number }> => {
    await assertAdmin(context.supabase as never, context.userId)

    // Load SLA target for the selected pillar (or use the tightest target).
    const { data: pillars } = await context.supabase
      .from('pillar_status')
      .select('pillar, sla_target_minutes')
    const slaMap = new Map<string, number>(
      (pillars ?? []).map((p) => [p.pillar as string, (p.sla_target_minutes as number) ?? 30]),
    )
    const slaMinutes = data.pillar ? (slaMap.get(data.pillar) ?? 30) : 30

    let q = context.supabase
      .from('situations')
      .select('id, pillar, title, clean_text, body, room_id, created_at, human_response_at, is_public, is_seed, crisis_flag, deleted_at')
      .eq('is_public', true)
      .eq('is_seed', false)
      .eq('crisis_flag', false)
      .is('deleted_at', null)
      .is('human_response_at', null)
      .not('room_id', 'is', null)
      .order('created_at', { ascending: true })
      .limit(data.limit)
    if (data.pillar) q = q.eq('pillar', data.pillar)
    const { data: sits, error } = await q
    if (error) throw new Error(error.message)
    const list = sits ?? []
    if (list.length === 0) return { rows: [], sla_minutes: slaMinutes }

    const roomIds = list.map((s) => s.room_id).filter(Boolean) as string[]
    const { data: rooms } = await context.supabase
      .from('rooms')
      .select('id, alias, emoji, support, hall, title, body')
      .in('id', roomIds)
    const roomMap = new Map<string, { alias: string; emoji: string; support: 'heard' | 'advice'; hall: string; title: string | null; body: string }>(
      (rooms ?? []).map((r) => [
        r.id as string,
        {
          alias: (r.alias as string) ?? 'someone',
          emoji: (r.emoji as string) ?? '🌸',
          support: ((r.support as string) === 'advice' ? 'advice' : 'heard'),
          hall: (r.hall as string) ?? 'healing',
          title: (r.title as string) ?? null,
          body: (r.body as string) ?? '',
        },
      ]),
    )

    const now = Date.now()
    const rows: RelateQueueRow[] = list.map((s) => {
      const room = roomMap.get(s.room_id as string)
      const created = new Date(s.created_at as string).getTime()
      const minutes = Math.max(0, Math.round((now - created) / 60000))
      const target = slaMap.get(s.pillar as string) ?? slaMinutes
      return {
        situation_id: s.id as string,
        room_id: s.room_id as string,
        pillar: s.pillar as string,
        title: (s.title as string) ?? room?.title ?? null,
        body: ((s.body as string) || (s.clean_text as string) || room?.body || '').slice(0, 400),
        alias: room?.alias ?? 'someone',
        emoji: room?.emoji ?? '🌸',
        support: room?.support ?? 'heard',
        hall: room?.hall ?? 'healing',
        created_at: s.created_at as string,
        minutes_open: minutes,
        past_sla: minutes > target,
      }
    })
    return { rows, sla_minutes: slaMinutes }
  })

export const relateQueueStats = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recent } = await context.supabase
      .from('situations')
      .select('created_at, human_response_at')
      .eq('is_public', true)
      .eq('is_seed', false)
      .eq('crisis_flag', false)
      .gte('created_at', since)
      .is('deleted_at', null)
    const total = recent?.length ?? 0
    const responded = (recent ?? []).filter((r) => !!r.human_response_at).length
    const within = (recent ?? []).filter((r) => {
      if (!r.human_response_at) return false
      const dt =
        new Date(r.human_response_at as string).getTime() -
        new Date(r.created_at as string).getTime()
      return dt <= 30 * 60 * 1000
    }).length
    const median = (() => {
      const deltas = (recent ?? [])
        .filter((r) => !!r.human_response_at)
        .map(
          (r) =>
            new Date(r.human_response_at as string).getTime() -
            new Date(r.created_at as string).getTime(),
        )
        .sort((a, b) => a - b)
      if (!deltas.length) return null
      return Math.round(deltas[Math.floor(deltas.length / 2)] / 60000)
    })()
    return {
      window_days: 7,
      total_public_spills: total,
      responded,
      within_sla: within,
      sla_pct: total ? Math.round((within / total) * 100) : 0,
      median_minutes_to_first_response: median,
    }
  })
