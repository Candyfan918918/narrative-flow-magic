// Check-in capture spine: server functions powering the floating eye and the
// per-checkin card. All writes go through the signed-in user's RLS context.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

// In-voice beat copy keyed by checkin type (matches §3b of the launch spec).
export const BEATS: Record<string, { title: string; chips: { value: string; label: string }[]; kind: 'trajectory' | 'action' | 'resolution' | 'feeling' }> = {
  day0:  { title: 'before you go — how are you sitting with it right now?', kind: 'trajectory', chips: [
    { value: 'better', label: 'lighter' }, { value: 'same', label: 'same' }, { value: 'worse', label: 'heavier' }] },
  day1:  { title: "been thinking about it. how'd you sleep on it?", kind: 'trajectory', chips: [
    { value: 'better', label: 'better' }, { value: 'same', label: 'same' }, { value: 'worse', label: 'worse' }] },
  day2:  { title: 'no pressure, just checking — you good today?', kind: 'feeling', chips: [
    { value: 'okay', label: 'okay' }, { value: 'meh', label: 'meh' }, { value: 'rough', label: 'rough' }] },
  day3:  { title: 'ok be honest — did you do anything or still stewing 😤', kind: 'action', chips: [
    { value: 'acted', label: 'acted on it' }, { value: 'stewing', label: 'still stewing' }, { value: 'worse', label: 'got worse' }] },
  day7:  { title: 'where are things now?', kind: 'resolution', chips: [
    { value: 'in_progress', label: 'in progress' }, { value: 'resolved', label: 'resolved' }, { value: 'avoided', label: 'avoided' }, { value: 'worse', label: 'worse' }] },
  day14: { title: 'looking back — what happened?', kind: 'resolution', chips: [
    { value: 'resolved', label: 'resolved' }, { value: 'avoided', label: 'avoided' }, { value: 'worse', label: 'worse' }, { value: 'in_progress', label: 'still going' }] },
  adaptive: { title: "still going? where's it at now?", kind: 'resolution', chips: [
    { value: 'in_progress', label: 'still in it' }, { value: 'resolved', label: 'resolved' }, { value: 'avoided', label: 'avoided' }] },
}

// Surface the next due check-in for the floating eye.
export const getDueCheckin = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from('checkins')
      .select('id, type, situation_id, state, scheduled_at')
      .eq('alias_id', context.userId)
      .in('state', ['scheduled', 'sent', 'opened'])
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (!data) return null
    return { ...data, beat: BEATS[data.type] ?? null }
  })

// Fetch a specific check-in card (e.g. from the email deep link).
export const getCheckin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ck } = await context.supabase
      .from('checkins')
      .select('id, type, situation_id, state, scheduled_at')
      .eq('id', data.id)
      .eq('alias_id', context.userId)
      .maybeSingle()
    if (!ck) return null
    // Mark opened
    await context.supabase
      .from('checkins')
      .update({ state: 'opened', opened_at: new Date().toISOString() })
      .eq('id', ck.id)
      .in('state', ['scheduled', 'sent'])
    return { ...ck, beat: BEATS[ck.type] ?? null }
  })

const ResponseInput = z.object({
  checkin_id: z.string().uuid(),
  trajectory: z.enum(['better', 'same', 'worse']).nullish(),
  action: z.string().max(40).nullish(),
  resolution: z.enum(['in_progress', 'resolved', 'avoided', 'worse']).nullish(),
  would_again: z.enum(['yes', 'no', 'na']).nullish(),
  feeling_tap: z.string().max(40).nullish(),
  rescan: z.number().int().min(0).max(999).nullish(),
  clean_text: z.string().max(2000).nullish(),
})

export const recordCheckinResponse = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ResponseInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: ck, error: ckErr } = await context.supabase
      .from('checkins')
      .select('id, situation_id, alias_id')
      .eq('id', data.checkin_id)
      .eq('alias_id', context.userId)
      .maybeSingle()
    if (ckErr || !ck) throw new Error('checkin not found')

    const { error } = await context.supabase.from('checkin_responses').insert({
      checkin_id: ck.id,
      situation_id: ck.situation_id,
      alias_id: context.userId,
      trajectory: data.trajectory ?? null,
      action: data.action ?? null,
      resolution: data.resolution ?? null,
      would_again: data.would_again ?? null,
      feeling_tap: data.feeling_tap ?? null,
      rescan: data.rescan ?? null,
      clean_text: data.clean_text ?? null,
    })
    if (error) throw error

    await context.supabase
      .from('checkins')
      .update({ state: 'responded', responded_at: new Date().toISOString() })
      .eq('id', ck.id)

    return { ok: true }
  })

export const setNotificationPrefs = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email().optional(),
      opt_in: z.boolean(),
      timezone: z.string().max(64).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { notif_email_opt_in: data.opt_in }
    if (data.email) patch.notif_email = data.email
    if (data.timezone) patch.timezone = data.timezone
    const { error } = await context.supabase
      .from('aliases')
      .update(patch)
      .eq('user_id', context.userId)
    if (error) throw error
    return { ok: true }
  })

export const snoozeCheckin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from('checkins')
      .update({ state: 'skipped' })
      .eq('id', data.id)
      .eq('alias_id', context.userId)
    return { ok: true }
  })
