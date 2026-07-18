// Public server fn: the 8 newest public rooms for the homepage hero ticker
// + rooms strip. Follows the same pattern as `countOpenRooms` — read-only,
// service role, plain DTO out. Excludes anything created in the last 10
// minutes because the privacy scrubber may still be finishing on it.
import { createServerFn } from '@tanstack/react-start'

export type NewestRoom = {
  id: string
  emoji: string
  alias: string
  title: string
  created_at: string
  sitting: number
}

export const listNewestRooms = createServerFn({ method: 'GET' }).handler(async (): Promise<NewestRoom[]> => {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: rooms, error } = await supabaseAdmin
      .from('rooms')
      .select('id, alias, emoji, title, created_at')
      .lt('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(8)
    if (error || !rooms) return []
    // Best-effort "sitting" count via room_relates aggregate.
    const ids = rooms.map((r) => r.id)
    let counts = new Map<string, number>()
    if (ids.length) {
      const { data: rel } = await supabaseAdmin
        .from('room_relates')
        .select('room_id')
        .in('room_id', ids)
      if (rel) counts = rel.reduce((m, r) => {
        const k = (r as { room_id: string }).room_id; m.set(k, (m.get(k) || 0) + 1); return m
      }, new Map<string, number>())
    }
    return rooms.map((r) => ({
      id: r.id as string,
      emoji: (r.emoji as string) || '🫧',
      alias: (r.alias as string) || 'someone',
      title: (r.title as string) || 'a situation',
      created_at: r.created_at as string,
      sitting: Math.max(1, counts.get(r.id as string) || 0),
    }))
  } catch {
    return []
  }
})
