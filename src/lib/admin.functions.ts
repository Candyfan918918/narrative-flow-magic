// Admin-only server functions. Every handler verifies has_role('admin') on
// the caller before touching data. Unauthorized calls throw.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

async function assertAdmin(ctx: unknown): Promise<void> {
  const c = ctx as { supabase: { rpc: (fn: 'has_role', args: { _user_id: string; _role: 'admin' }) => PromiseLike<{ data: unknown; error: unknown }> }; userId: string }
  const { data, error } = await c.supabase.rpc('has_role', { _user_id: c.userId, _role: 'admin' })
  if (error || !data) throw new Error('Forbidden')
}

export const adminListUsers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      q: z.string().max(120).optional(),
      limit: z.number().int().min(1).max(200).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const limit = data.limit ?? 100
    let query = supabaseAdmin
      .from('profiles')
      .select('user_id, email, first_name, last_name, full_name, avatar_url, provider, is_anonymous, first_visit_at, last_visit_at, visit_count, last_country, last_city')
      .order('last_visit_at', { ascending: false })
      .limit(limit)
    if (data.q?.trim()) {
      const q = data.q.trim()
      query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    }
    const { data: rows, error } = await query
    if (error) throw new Error(error.message)
    const profiles = (rows ?? []) as Array<Record<string, unknown> & { user_id: string }>
    // Enrich with alias + counts.
    const ids = profiles.map((p) => p.user_id)
    const [aliasRes, statsResults] = await Promise.all([
      ids.length
        ? supabaseAdmin.from('aliases').select('user_id, display_name, emoji').in('user_id', ids)
        : Promise.resolve({ data: [] as Array<{ user_id: string; display_name: string; emoji: string }> }),
      Promise.all(
        ids.map((id) =>
          supabaseAdmin.rpc('get_user_stats', { _user_id: id }).then(({ data: d }) => ({ id, d })),
        ),
      ),
    ])
    const aliasMap: Record<string, { display_name: string; emoji: string }> = {}
    for (const r of (aliasRes.data ?? []) as Array<{ user_id: string; display_name: string; emoji: string }>) {
      aliasMap[r.user_id] = { display_name: r.display_name, emoji: r.emoji }
    }
    const statsMap: Record<string, { spills: number; comments: number; reactions: number }> = {}
    for (const s of statsResults) {
      const row = (Array.isArray(s.d) ? s.d[0] : s.d) as { spills?: number; comments?: number; reactions?: number } | null
      statsMap[s.id] = {
        spills: Number(row?.spills ?? 0),
        comments: Number(row?.comments ?? 0),
        reactions: Number(row?.reactions ?? 0),
      }
    }
    return profiles.map((p) => ({
      ...p,
      alias: aliasMap[p.user_id] ?? null,
      stats: statsMap[p.user_id] ?? { spills: 0, comments: 0, reactions: 0 },
    }))
  })

export const adminListEvents = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().max(80).optional(),
      user_id: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    let query = supabaseAdmin
      .from('events')
      .select('id, user_id, session_id, ts, name, properties')
      .order('ts', { ascending: false })
      .limit(data.limit ?? 200)
    if (data.name) query = query.eq('name', data.name)
    if (data.user_id) query = query.eq('user_id', data.user_id)
    const { data: rows, error } = await query
    if (error) throw new Error(error.message)
    return rows ?? []
  })
