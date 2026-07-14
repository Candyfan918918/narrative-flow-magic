// Phase 2c — Single-pillar gating.
// Returns the list of pillars that are "opened" right now (opened_at <= now()).
// Read via service role because pillar_status is now authenticated-only at the
// RLS layer, but this config is non-sensitive and consumed by public routes
// (Stream / Halls) that render without a session.
import { createServerFn } from '@tanstack/react-start'

export type PillarRow = {
  pillar: string
  opened_at: string | null
  sla_target_minutes: number
}

export const listPillars = createServerFn({ method: 'GET' }).handler(async (): Promise<PillarRow[]> => {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { data, error } = await supabaseAdmin
    .from('pillar_status')
    .select('pillar, opened_at, sla_target_minutes')
  if (error) return []
  return (data ?? []) as PillarRow[]
})
