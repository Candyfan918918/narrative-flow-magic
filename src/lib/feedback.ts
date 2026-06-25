/* Shutap — client feedback capture. Pseudonymous: alias + opaque session id,
   never real identity. Events batch-POST to /api/feedback/events. */
import { getAlias } from './auth'

const LOVE = new Set([
  'relate','react','share_accept','scan_done','spill_publish','mirror_open',
  'mirror_reading','mirror_unlock','comment_post','room_dwell_long','return_visit','rate_loved',
])
const FRICTION = new Set([
  'spill_abandon','scan_abandon','share_dismiss','room_bounce','dead_click',
  'rage_click','paywall_bounce','rate_friction','error',
])
const QUESTION = new Set(['companion_q','search'])

export type Valence = 'love' | 'friction' | 'question' | 'neutral'
export function valenceFor(type: string): Valence {
  if (LOVE.has(type)) return 'love'
  if (FRICTION.has(type)) return 'friction'
  if (QUESTION.has(type)) return 'question'
  return 'neutral'
}

export interface FeedbackPayload {
  target?: string
  label?: string
  text?: string
  score?: number
  signature?: string
  intent?: string
  kind?: string
  sec?: number
  note?: string
  mode?: string
  trigger?: string
  v?: Valence
}

interface QueuedEvent extends FeedbackPayload {
  type: string
  t: number
  page: string
  sid: string
  alias?: string
  v: Valence
}

function sid(): string {
  try {
    let s = sessionStorage.getItem('shutap_sid')
    if (!s) {
      s = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
      sessionStorage.setItem('shutap_sid', s)
    }
    return s
  } catch {
    return 'nosid'
  }
}

function aliasLabel(): string | undefined {
  try {
    const a = getAlias()
    if (!a) return undefined
    // existing Alias shape carries emoji + adjective + nationality + animal
    const parts = [a.emoji, a.adjective, a.nationality, a.animal].filter(Boolean)
    return parts.join(' ').trim() || undefined
  } catch {
    return undefined
  }
}

const queue: QueuedEvent[] = []
let timer: number | null = null

function flush() {
  timer = null
  if (!queue.length) return
  const batch = queue.splice(0, queue.length)
  const body = JSON.stringify({ events: batch })
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/feedback/events', blob)
      return
    }
  } catch { /* fall through */ }
  fetch('/api/feedback/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => { /* swallow */ })
}

export function track(type: string, payload: FeedbackPayload = {}): void {
  if (typeof window === 'undefined') return
  try {
    const ev: QueuedEvent = {
      type,
      t: Date.now(),
      page: location.pathname + location.search,
      sid: sid(),
      alias: aliasLabel(),
      v: payload.v ?? valenceFor(type),
      ...payload,
    }
    queue.push(ev)
    if (queue.length >= 20) {
      if (timer) { clearTimeout(timer); timer = null }
      flush()
      return
    }
    if (timer == null) {
      timer = window.setTimeout(flush, 2500)
    }
  } catch { /* noop */ }
}

let installed = false
export function installFeedback(): void {
  if (typeof window === 'undefined' || installed) return
  installed = true

  // return_visit
  try {
    const last = Number(localStorage.getItem('shutap_last_visit') || '0')
    const now = Date.now()
    if (last && now - last > 30 * 60 * 1000) {
      track('return_visit', { sec: Math.round((now - last) / 60000) })
    }
    localStorage.setItem('shutap_last_visit', String(now))
  } catch { /* noop */ }

  // initial page_view
  track('page_view')

  // page_view on SPA navigation (react-router-dom uses history)
  let lastPath = location.pathname + location.search
  const fire = () => {
    const p = location.pathname + location.search
    if (p !== lastPath) {
      lastPath = p
      track('page_view')
    }
  }
  const origPush = history.pushState
  const origReplace = history.replaceState
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    const r = origPush.apply(this, args)
    queueMicrotask(fire)
    return r
  }
  history.replaceState = function (...args: Parameters<typeof history.replaceState>) {
    const r = origReplace.apply(this, args)
    queueMicrotask(fire)
    return r
  }
  window.addEventListener('popstate', fire)

  // rage_click — 3+ taps in ~1.2s landing on non-interactive elements
  const taps: number[] = []
  window.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null
    const interactive = !!target?.closest?.('a,button,input,textarea,select,label,[role="button"],[onclick]')
    if (interactive) return
    const now = Date.now()
    taps.push(now)
    while (taps.length && now - taps[0] > 1200) taps.shift()
    if (taps.length >= 3) {
      taps.length = 0
      track('rage_click', { target: target?.tagName?.toLowerCase() })
    }
  }, true)

  // global errors
  window.addEventListener('error', (e) => {
    track('error', { text: String(e.message).slice(0, 300) })
  })

  // flush on unload
  window.addEventListener('pagehide', flush)
  window.addEventListener('beforeunload', flush)
}

export const feedback = { track }
