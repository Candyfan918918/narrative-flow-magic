// Server-side entitlement checks. The client NEVER decides Mirror access —
// it asks this endpoint. Owner demo email is always entitled. Everyone
// else needs an active row in `subscriptions`.
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { isOwnerDemoEmail } from './require-real-user'

export type MirrorEntitlement = {
  entitled: boolean
  demoAccount: boolean
  reason: 'demo' | 'active_subscription' | 'no_subscription' | 'anonymous'
}

export const getMirrorEntitlement = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MirrorEntitlement> => {
    const claims = context.claims as { is_anonymous?: boolean; email?: string } | undefined
    if (claims?.is_anonymous) {
      return { entitled: false, demoAccount: false, reason: 'anonymous' }
    }
    if (isOwnerDemoEmail(claims?.email)) {
      return { entitled: true, demoAccount: true, reason: 'demo' }
    }
    const now = new Date().toISOString()
    const { data } = await context.supabase
      .from('subscriptions')
      .select('status,current_period_end')
      .eq('user_id', context.userId)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
    const row = data?.[0]
    const active = !!row && (!row.current_period_end || row.current_period_end > now)
    return {
      entitled: active,
      demoAccount: false,
      reason: active ? 'active_subscription' : 'no_subscription',
    }
  })
