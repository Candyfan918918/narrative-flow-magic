// Public server fn: real count of open, visible rooms.
// Used by the homepage hero to replace the fabricated live counter.
// Counts public, non-crisis, non-deleted situations that have opened a room.
// Seed rooms are included because they are real rows that render.
import { createServerFn } from '@tanstack/react-start'

export const countOpenRooms = createServerFn({ method: 'GET' }).handler(async (): Promise<number> => {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { count, error } = await supabaseAdmin
      .from('situations')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true)
      .eq('crisis_flag', false)
      .is('deleted_at', null)
      .not('room_id', 'is', null)
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
})
