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
  // TEMP: hardcoded to verify PostHog delivery end-to-end. Once confirmed,
  // revert to import.meta.env.VITE_POSTHOG_KEY / VITE_POSTHOG_HOST.
  const key = 'phc_AbkqMae5LW3GCw9Be7Sqp4VChsY6vSDYKYEjL3tZSupE'
  const host = 'https://us.i.posthog.com'
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
    console.log('PostHog initialized')
  } catch (e) {
    console.warn('PostHog init failed', e)
    _ph = null
  }
}


export function posthogIdentify(
  userId: string,
  props: Record<string, unknown> = {},
): void {
  try { _ph?.identify(userId, props) } catch { /* noop */ }
}
