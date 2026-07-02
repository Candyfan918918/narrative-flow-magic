// PostHog wrapper. Silent no-op if VITE_POSTHOG_KEY isn't configured.
// Consumers call posthog()?.capture(...), posthogIdentify(...), etc.
import type { PostHog } from 'posthog-js'

let _ph: PostHog | null = null
let _initTried = false

export function posthog(): PostHog | null {
  return _ph
}

export async function initPostHog(): Promise<void> {
  if (_initTried || typeof window === 'undefined') return
  _initTried = true
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'
  if (!key) return
  try {
    const mod = await import('posthog-js')
    mod.default.init(key, {
      api_host: host,
      capture_pageview: false, // we send explicit page_view events
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: false,
    })
    _ph = mod.default
  } catch {
    _ph = null
  }
}

export function posthogIdentify(
  userId: string,
  props: Record<string, unknown> = {},
): void {
  try { _ph?.identify(userId, props) } catch { /* noop */ }
}
