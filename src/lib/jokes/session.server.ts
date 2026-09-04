// Optional-identity resolution for the joke-card surface.
//
// The landing surface must work for a signed-out visitor, so it cannot use
// `requireSupabaseAuth` (which throws 401). Instead every joke server fn
// resolves identity here: a valid bearer token wins, otherwise the caller is
// a guest keyed by their browser session id. A client claiming a tier gains
// nothing — the tier is derived from the token and the subscriptions table.
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export type JokeIdentity = {
  userId: string | null
  isAnonymousUser: boolean
  tier: 'guest' | 'free' | 'paying'
  subjectKey: string
}

function publishableClient(token?: string) {
  const url = process.env['SUPABASE_URL']!
  const key = process.env['SUPABASE_PUBLISHABLE_KEY']!
  return createClient<Database>(url, key, {
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers)
        if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) {
          headers.delete('Authorization')
        }
        headers.set('apikey', key)
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return fetch(input, { ...init, headers })
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  })
}

function bearer(): string | null {
  try {
    const req = getRequest()
    const header = req?.headers?.get('authorization')
    if (!header || !header.startsWith('Bearer ')) return null
    const token = header.slice(7)
    return token && token.split('.').length === 3 ? token : null
  } catch {
    return null
  }
}

/** Resolve who is calling, and what they are entitled to, server-side. */
export async function resolveJokeIdentity(anonSessionId: string | null): Promise<JokeIdentity> {
  const anon = (anonSessionId ?? '').slice(0, 64)
  const guest: JokeIdentity = {
    userId: null,
    isAnonymousUser: false,
    tier: 'guest',
    subjectKey: 'anon:' + (anon || 'unknown'),
  }

  const token = bearer()
  if (!token) return guest

  try {
    const client = publishableClient(token)
    const { data, error } = await client.auth.getClaims(token)
    const claims = data?.claims as { sub?: string; is_anonymous?: boolean } | undefined
    if (error || !claims?.sub) return guest
    // A Supabase anonymous user is not a signed-in person for our tiers.
    if (claims.is_anonymous) return guest

    const userId = claims.sub
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const env = process.env['STRIPE_LIVE_API_KEY'] ? 'live' : 'sandbox'
    const { data: paying } = await supabaseAdmin.rpc('has_active_mirror', {
      user_uuid: userId,
      check_env: env,
    })

    return {
      userId,
      isAnonymousUser: false,
      tier: paying ? 'paying' : 'free',
      subjectKey: 'user:' + userId,
    }
  } catch {
    return guest
  }
}

/** Local calendar day for the caller. Falls back to UTC when tz is unusable. */
export function localDay(timezone?: string | null): string {
  const tz = (timezone ?? '').slice(0, 64)
  if (tz) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    } catch { /* fall through to UTC */ }
  }
  return new Date().toISOString().slice(0, 10)
}
