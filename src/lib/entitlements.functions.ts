// Server-side entitlement checks. The client NEVER decides Mirror access —
// it asks this endpoint. Every signed-in user needs an active/trialing row
// in `subscriptions` (or a canceled row still inside its paid period);
// anonymous users are never entitled. No account is special-cased.
//
// IMPORTANT: reads MUST filter by `environment` — sandbox and live rows
// coexist in the same table and default to 'sandbox'. Without the filter,
// a sandbox subscriber appears entitled in live and vice versa.
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type MirrorEntitlement = {
  entitled: boolean
  demoAccount: boolean
  // 'demo' is retained in the union for type compatibility with existing
  // consumers but is never returned by this handler.
  reason: 'demo' | 'active_subscription' | 'grace_period' | 'past_due' | 'no_subscription' | 'anonymous'
}

export const getMirrorEntitlement = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: 'sandbox' | 'live' }) => {
    if (data?.environment !== 'sandbox' && data?.environment !== 'live') {
      throw new Error('Invalid environment')
    }
    return data
  })
  .handler(async ({ data, context }): Promise<MirrorEntitlement> => {
    const claims = context.claims as { is_anonymous?: boolean; email?: string } | undefined
    if (claims?.is_anonymous) {
      return { entitled: false, demoAccount: false, reason: 'anonymous' }
    }
    const now = new Date().toISOString()
    const { data: rows } = await context.supabase
      .from('subscriptions')
      .select('status,current_period_end')
      .eq('user_id', context.userId)
      .eq('environment', data.environment)
      .in('status', ['active', 'trialing', 'past_due', 'canceled'])
      .order('current_period_end', { ascending: false })
      .limit(1)
    const row = rows?.[0]
    if (!row) return { entitled: false, demoAccount: false, reason: 'no_subscription' }
    const withinPeriod = !row.current_period_end || row.current_period_end > now
    if ((row.status === 'active' || row.status === 'trialing') && withinPeriod) {
      return { entitled: true, demoAccount: false, reason: 'active_subscription' }
    }
    // Dunning: Stripe is still retrying. Keep access so users aren't
    // punished for a card blip; webhook downgrades to canceled on failure.
    if (row.status === 'past_due' && withinPeriod) {
      return { entitled: true, demoAccount: false, reason: 'past_due' }
    }
    // Cancel-at-period-end: retain access until the period actually ends.
    if (row.status === 'canceled' && row.current_period_end && row.current_period_end > now) {
      return { entitled: true, demoAccount: false, reason: 'grace_period' }
    }
    return { entitled: false, demoAccount: false, reason: 'no_subscription' }
  })
