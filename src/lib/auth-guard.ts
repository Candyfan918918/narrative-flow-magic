// Client-side interaction gate. Any action that WRITES to the backend
// (spill, scan save, comment, react, relate, alias mint, subscribe) must
// call requireRealUser({ intent }) before proceeding. Anonymous or missing
// sessions get their intent captured and are redirected to /welcome; the
// welcome flow resumes the intent after login.
import { supabase } from '@/integrations/supabase/client'
import { getRouterRef } from '@/lib/router-ref'

export type PendingIntent =
  | { kind: 'spill' }
  | { kind: 'scan' }
  | { kind: 'comment'; roomId: string }
  | { kind: 'relate'; roomId: string }
  | { kind: 'react'; roomId: string; reaction?: string }
  | { kind: 'subscribe' }
  | { kind: 'custom'; url: string }

const INTENT_KEY = 'shutap_pending_intent'
const RETURN_KEY = 'shutap_returnTo'

export function saveIntent(intent: PendingIntent): void {
  try {
    sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent))
    sessionStorage.setItem(RETURN_KEY, window.location.href)
  } catch { /* noop */ }
}

export function readIntent(): PendingIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PendingIntent
  } catch { return null }
}

export function clearIntent(): void {
  try { sessionStorage.removeItem(INTENT_KEY) } catch { /* noop */ }
}

/** Returns true if a real signed-in user is present. Otherwise captures the
 *  intent and redirects to /welcome. */
export async function requireRealUser(intent: PendingIntent): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  const u = data.session?.user as { is_anonymous?: boolean } | undefined
  if (data.session && !u?.is_anonymous) return true
  saveIntent(intent)
  window.location.assign('/welcome')
  return false
}

/** Resolve a pending intent into a URL to bounce back to after auth. */
export function resolveIntentUrl(intent: PendingIntent): string {
  switch (intent.kind) {
    case 'spill': return '/#spill'
    case 'scan': return '/#scan'
    case 'comment':
    case 'relate':
    case 'react':
      return '/room?id=' + encodeURIComponent(intent.roomId)
    case 'subscribe': return '/subscribe'
    case 'custom': return intent.url
  }
}
