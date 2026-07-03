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

const SORT_COLUMNS = ['last_visit_at', 'last_login_at', 'signup_at', 'visit_count', 'login_count', 'email'] as const
type SortCol = typeof SORT_COLUMNS[number]

export const adminListUsers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      q: z.string().max(120).optional(),
      limit: z.number().int().min(1).max(500).optional(),
      include_anonymous: z.boolean().optional(),
      sort: z.enum(SORT_COLUMNS).optional(),
      dir: z.enum(['asc', 'desc']).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const limit = data.limit ?? 200
    const sort: SortCol = data.sort ?? 'last_visit_at'
    const ascending = data.dir === 'asc'
    let query = supabaseAdmin
      .from('profiles')
      .select('user_id, email, first_name, last_name, full_name, avatar_url, provider, is_anonymous, signup_at, first_visit_at, last_visit_at, last_login_at, login_count, visit_count, last_country, last_city')
      .order(sort, { ascending, nullsFirst: false })
      .limit(limit)
    if (!data.include_anonymous) query = query.eq('is_anonymous', false)
    if (data.q?.trim()) {
      const q = data.q.trim().replace(/[,%]/g, '')
      query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    }
    const { data: rows, error } = await query
    if (error) throw new Error(error.message)
    const profiles = (rows ?? []) as Array<Record<string, unknown> & { user_id: string }>
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

// ---------- analytics ----------

export const adminAnalytics = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({}).parse(d ?? {}))
  .handler(async ({ context }) => {
    await assertAdmin(context)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const now = Date.now()
    const iso = (ms: number) => new Date(ms).toISOString()
    const d1 = iso(now - 24 * 3600 * 1000)
    const d7 = iso(now - 7 * 24 * 3600 * 1000)
    const d30 = iso(now - 30 * 24 * 3600 * 1000)

    const [
      totalReal, newSignups7, newSignups30,
      dauEvents, wauEvents, mauEvents,
      totalVisits, visits7, visits30, revisits30,
      convertedGuests, providerRows, recentSignins,
      countryRows, eventNames, eventCounts7, eventCounts30,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('user_id', { count: 'exact', head: true }).eq('is_anonymous', false),
      supabaseAdmin.from('profiles').select('user_id', { count: 'exact', head: true }).eq('is_anonymous', false).gte('signup_at', d7),
      supabaseAdmin.from('profiles').select('user_id', { count: 'exact', head: true }).eq('is_anonymous', false).gte('signup_at', d30),
      supabaseAdmin.from('events').select('user_id').not('user_id', 'is', null).gte('ts', d1),
      supabaseAdmin.from('events').select('user_id').not('user_id', 'is', null).gte('ts', d7),
      supabaseAdmin.from('events').select('user_id').not('user_id', 'is', null).gte('ts', d30),
      supabaseAdmin.from('visits').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('visits').select('id', { count: 'exact', head: true }).gte('started_at', d7),
      supabaseAdmin.from('visits').select('id', { count: 'exact', head: true }).gte('started_at', d30),
      supabaseAdmin.from('visits').select('id', { count: 'exact', head: true }).gte('started_at', d30).eq('is_revisit', true),
      supabaseAdmin.from('events').select('user_id', { count: 'exact', head: true }).eq('name', 'sign_up'),
      supabaseAdmin.from('profiles').select('provider').eq('is_anonymous', false),
      supabaseAdmin.from('profiles').select('user_id, email, full_name, first_name, last_name, provider, last_login_at').eq('is_anonymous', false).not('last_login_at', 'is', null).order('last_login_at', { ascending: false }).limit(20),
      supabaseAdmin.from('visits').select('country').gte('started_at', d30).not('country', 'is', null),
      supabaseAdmin.from('events').select('name').gte('ts', d30),
      supabaseAdmin.from('events').select('name').gte('ts', d7),
      supabaseAdmin.from('events').select('name').gte('ts', d30),
    ])

    const uniq = (rows: { data: Array<{ user_id: string | null }> | null }) => {
      const s = new Set<string>()
      for (const r of rows.data ?? []) if (r.user_id) s.add(r.user_id)
      return s.size
    }
    const tally = <T extends string>(rows: { data: Array<Record<string, unknown>> | null }, key: T) => {
      const m: Record<string, number> = {}
      for (const r of rows.data ?? []) {
        const v = (r[key] as string | null) ?? '—'
        m[v] = (m[v] ?? 0) + 1
      }
      return m
    }

    const providers = tally(providerRows as never, 'provider')
    const countries = tally(countryRows as never, 'country')
    const topCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 10)

    const events7 = tally(eventCounts7 as never, 'name')
    const events30 = tally(eventCounts30 as never, 'name')
    const eventKeys = Array.from(new Set([...Object.keys(events7), ...Object.keys(events30)])).sort()
    const eventTable = eventKeys.map((n) => ({ name: n, d7: events7[n] ?? 0, d30: events30[n] ?? 0 }))

    void eventNames
    const visits30Total = visits30.count ?? 0
    const revisits = revisits30.count ?? 0
    const newVisits = Math.max(0, visits30Total - revisits)

    return {
      generated_at: iso(now),
      users: {
        total_real: totalReal.count ?? 0,
        new_7d: newSignups7.count ?? 0,
        new_30d: newSignups30.count ?? 0,
        guest_converted: convertedGuests.count ?? 0,
      },
      activity: {
        dau: uniq(dauEvents as never),
        wau: uniq(wauEvents as never),
        mau: uniq(mauEvents as never),
      },
      visits: {
        total: totalVisits.count ?? 0,
        d7: visits7.count ?? 0,
        d30: visits30Total,
        new_30d: newVisits,
        returning_30d: revisits,
      },
      providers,
      top_countries: topCountries,
      events: eventTable,
      recent_signins: (recentSignins.data ?? []) as Array<{
        user_id: string; email: string | null; full_name: string | null;
        first_name: string | null; last_name: string | null;
        provider: string | null; last_login_at: string | null;
      }>,
    }
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
