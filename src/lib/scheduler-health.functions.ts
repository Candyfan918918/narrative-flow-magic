// Phase 3a — Scheduler health stats for the admin dashboard.
// Admin-only. Returns counts for the last 24h so the welcoming team can
// see at a glance whether check-ins are flowing.
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type SchedulerHealth = {
  scheduled_overdue: number
  sent_24h: number
  failed_24h: number
  retrying: number
  oldest_overdue_minutes: number | null
}

export const schedulerHealth = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SchedulerHealth> => {
    const { data: isAdmin } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    })
    if (!isAdmin) throw new Error('forbidden')

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()

    const [overdue, sent, failed, retrying, oldest] = await Promise.all([
      supabaseAdmin.from('checkins').select('id', { count: 'exact', head: true })
        .eq('state', 'scheduled').lte('scheduled_at', now),
      supabaseAdmin.from('checkins').select('id', { count: 'exact', head: true })
        .eq('state', 'sent').gte('sent_at', since),
      supabaseAdmin.from('checkins').select('id', { count: 'exact', head: true })
        .eq('state', 'failed').gte('scheduled_at', since),

      supabaseAdmin.from('checkins').select('id', { count: 'exact', head: true })
        .eq('state', 'scheduled').gt('attempts', 0),
      supabaseAdmin.from('checkins').select('scheduled_at')
        .eq('state', 'scheduled').lte('scheduled_at', now)
        .order('scheduled_at', { ascending: true }).limit(1).maybeSingle(),
    ])

    const oldestAt = oldest.data?.scheduled_at as string | undefined
    const oldestMin = oldestAt ? Math.round((Date.now() - new Date(oldestAt).getTime()) / 60000) : null

    return {
      scheduled_overdue: overdue.count ?? 0,
      sent_24h: sent.count ?? 0,
      failed_24h: failed.count ?? 0,
      retrying: retrying.count ?? 0,
      oldest_overdue_minutes: oldestMin,
    }
  })
