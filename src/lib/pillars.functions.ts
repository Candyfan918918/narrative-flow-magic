// Phase 2c — Single-pillar gating.
// Returns the list of pillars that are "opened" right now (opened_at <= now()).
// Public (anon) read so Stream + Halls can render without a session.
import { createClient } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import type { Database } from '@/integrations/supabase/types'

export type PillarRow = {
  pillar: string
  opened_at: string | null
  sla_target_minutes: number
}

export const listPillars = createServerFn({ method: 'GET' }).handler(async (): Promise<PillarRow[]> => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  )
  const { data, error } = await supabase
    .from('pillar_status')
    .select('pillar, opened_at, sla_target_minutes')
  if (error) return []
  return (data ?? []) as PillarRow[]
})
