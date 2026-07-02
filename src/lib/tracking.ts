// Client-side tracking wrapper. Fires visit + events into the DB via the
// server fns AND (when configured) into PostHog. Silent no-op when things
// aren't ready — never throws, never blocks render.
import { recordVisit, trackEventFn, upsertMyProfile } from './tracking.functions'
import { posthog, posthogIdentify } from './posthog'

const SESSION_KEY = 'shutap_session_id'
const VISIT_SENT_KEY = 'shutap_visit_sent'
const PROFILE_SENT_KEY = 'shutap_profile_sent'

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    let sid = sessionStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2))
      sessionStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return 'anon-' + Date.now()
  }
}

export async function trackEvent(name: string, properties: Record<string, unknown> = {}): Promise<void> {
  const session_id = getSessionId()
  try { posthog()?.capture(name, properties) } catch { /* noop */ }
  try {
    await trackEventFn({ data: { session_id, name, properties } })
  } catch { /* noop */ }
}

/** Idempotent per browser session — safe to call on every page. */
export async function recordVisitOnce(path: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    if (sessionStorage.getItem(VISIT_SENT_KEY)) return
    sessionStorage.setItem(VISIT_SENT_KEY, '1')
  } catch { /* noop */ }
  const session_id = getSessionId()
  const referrer = document.referrer || ''
  try {
    await recordVisit({ data: { session_id, path, referrer } })
  } catch { /* noop */ }
}

interface SupabaseUserLike {
  id: string
  email?: string | null
  is_anonymous?: boolean
  user_metadata?: Record<string, unknown> | null
  app_metadata?: Record<string, unknown> | null
}

export async function syncProfileFromSession(user: SupabaseUserLike | null | undefined): Promise<void> {
  if (!user || user.is_anonymous) return
  try {
    // Fire once per session per user id, so we don't hammer the DB every
    // route change; new sign-in from a fresh browser always fires.
    const key = `${PROFILE_SENT_KEY}:${user.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch { /* noop */ }
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const app = (user.app_metadata ?? {}) as Record<string, unknown>
  const asStr = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const first = asStr(meta.given_name) || asStr(meta.first_name) || null
  const last = asStr(meta.family_name) || asStr(meta.last_name) || null
  const full = asStr(meta.full_name) || asStr(meta.name) || (first && last ? `${first} ${last}` : null)
  const avatar = asStr(meta.avatar_url) || asStr(meta.picture) || null
  const provider = asStr(app.provider) || asStr(meta.provider) || 'email'
  const email = user.email || asStr(meta.email) || null
  try {
    await upsertMyProfile({
      data: {
        email,
        first_name: first,
        last_name: last,
        full_name: full,
        avatar_url: avatar,
        provider,
        is_anonymous: false,
      },
    })
  } catch { /* noop */ }
  try {
    posthogIdentify(user.id, {
      email,
      first_name: first,
      last_name: last,
      name: full,
      provider,
    })
  } catch { /* noop */ }
}
