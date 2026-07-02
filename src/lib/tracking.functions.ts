// User + behavior tracking server functions.
// All three are called optionally-authenticated: if the client sends a
// bearer token we upsert profile info; otherwise we still record the
// visit/event with a null user_id. Insert always goes through the service
// role so RLS never rejects a legitimate ping.
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'

function readUserFromRequest(): Promise<{ userId: string | null; token: string | null }> {
  const req = getRequest()
  const authHeader = req?.headers.get('authorization') || null
  if (!authHeader?.startsWith('Bearer ')) return Promise.resolve({ userId: null, token: null })
  const token = authHeader.slice(7)
  if (token.split('.').length !== 3) return Promise.resolve({ userId: null, token: null })
  // Best-effort decode of the JWT sub claim without a network round-trip.
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
    ) as { sub?: string; exp?: number }
    if (payload?.exp && payload.exp * 1000 < Date.now()) return Promise.resolve({ userId: null, token })
    return Promise.resolve({ userId: payload.sub ?? null, token })
  } catch {
    return Promise.resolve({ userId: null, token })
  }
}

function extractGeo(): { country: string | null; city: string | null; userAgent: string | null } {
  const req = getRequest()
  const h = req?.headers
  if (!h) return { country: null, city: null, userAgent: null }
  const country = h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || h.get('x-country') || null
  const city = h.get('cf-ipcity') || h.get('x-vercel-ip-city') || h.get('x-city') || null
  const userAgent = h.get('user-agent') || null
  return {
    country: country && country !== 'XX' ? country : null,
    city: city ? decodeURIComponent(city) : null,
    userAgent,
  }
}

// ---------- profiles ----------

const ProfileIn = z.object({
  email: z.string().email().nullable().optional(),
  first_name: z.string().max(80).nullable().optional(),
  last_name: z.string().max(80).nullable().optional(),
  full_name: z.string().max(160).nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  provider: z.string().max(40).nullable().optional(),
  is_anonymous: z.boolean().optional(),
})

export const upsertMyProfile = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => ProfileIn.parse(d))
  .handler(async ({ data }) => {
    const { userId } = await readUserFromRequest()
    if (!userId) return { ok: false, reason: 'no_auth' as const }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const geo = extractGeo()
    const now = new Date().toISOString()
    const existing = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_visit_at, visit_count, first_name, last_name, full_name, avatar_url, email')
      .eq('user_id', userId)
      .maybeSingle()
    const prev = existing.data as {
      first_visit_at?: string; visit_count?: number;
      first_name?: string | null; last_name?: string | null;
      full_name?: string | null; avatar_url?: string | null; email?: string | null;
    } | null
    // Apple returns name only on the FIRST authorization; preserve prior
    // values if the current payload has null/undefined.
    const merge = <T,>(next: T | null | undefined, prev: T | null | undefined): T | null | undefined =>
      next ?? prev
    const row = {
      user_id: userId,
      email: merge(data.email, prev?.email),
      first_name: merge(data.first_name, prev?.first_name),
      last_name: merge(data.last_name, prev?.last_name),
      full_name: merge(data.full_name, prev?.full_name),
      avatar_url: merge(data.avatar_url, prev?.avatar_url),
      provider: data.provider ?? null,
      is_anonymous: data.is_anonymous ?? false,
      first_visit_at: prev?.first_visit_at ?? now,
      last_visit_at: now,
      visit_count: (prev?.visit_count ?? 0) + 1,
      last_country: geo.country,
      last_city: geo.city,
      last_user_agent: geo.userAgent,
      updated_at: now,
    }
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert(row as never, { onConflict: 'user_id' })
    if (error) return { ok: false, reason: error.message }
    return { ok: true, geo }
  })

// ---------- visits ----------

const VisitIn = z.object({
  session_id: z.string().min(1).max(120),
  path: z.string().max(500).optional(),
  referrer: z.string().max(1000).optional(),
})

export const recordVisit = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => VisitIn.parse(d))
  .handler(async ({ data }) => {
    const { userId } = await readUserFromRequest()
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const geo = extractGeo()
    let isRevisit = false
    if (userId) {
      const prior = await supabaseAdmin
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      isRevisit = (prior.count ?? 0) > 0
    } else {
      const prior = await supabaseAdmin
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', data.session_id)
      isRevisit = (prior.count ?? 0) > 0
    }
    const { error } = await supabaseAdmin.from('visits').insert({
      user_id: userId,
      session_id: data.session_id,
      path: data.path ?? null,
      referrer: data.referrer ?? null,
      user_agent: geo.userAgent,
      country: geo.country,
      city: geo.city,
      is_revisit: isRevisit,
    } as never)
    if (error) return { ok: false, reason: error.message }
    return { ok: true, geo, isRevisit }
  })

// ---------- events ----------

const EventIn = z.object({
  session_id: z.string().min(1).max(120).optional(),
  name: z.string().min(1).max(80),
  properties: z.record(z.unknown()).optional(),
})

export const trackEventFn = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => EventIn.parse(d))
  .handler(async ({ data }) => {
    const { userId } = await readUserFromRequest()
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin.from('events').insert({
      user_id: userId,
      session_id: data.session_id ?? null,
      name: data.name,
      properties: (data.properties ?? {}) as never,
    } as never)
    if (error) return { ok: false, reason: error.message }
    return { ok: true }
  })
