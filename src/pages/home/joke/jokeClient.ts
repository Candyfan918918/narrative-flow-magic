// Browser-side plumbing for the joke-card surface. Holds no authority:
// the tier, the flip allowance and the card text all come from the server.
import { phCapture } from '@/lib/posthog'
import type { JokeTier } from '@/lib/jokes/deck'

const ANON_KEY = 'shutap_anon_id'

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch { /* fall through */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function anonSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const cur = localStorage.getItem(ANON_KEY)
    if (cur) return cur
    const next = uuid()
    localStorage.setItem(ANON_KEY, next)
    return next
  } catch {
    return uuid()
  }
}

export function clearAnonSessionId(): void {
  try { localStorage.removeItem(ANON_KEY) } catch { /* noop */ }
}

export function browserTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || '' } catch { return '' }
}

/** Every joke event carries the tier. Situation text never rides along. */
export function jokeTrack(name: string, tier: JokeTier, props: Record<string, unknown> = {}): void {
  void phCapture(name, { ...props, tier })
}

export function cardImageUrl(cardId: string): string {
  return `/api/public/joke-card?id=${encodeURIComponent(cardId)}`
}

/** Draw the server-authored card image to a canvas and save it as a PNG. */
export async function downloadCardPng(cardId: string): Promise<void> {
  const res = await fetch(cardImageUrl(cardId))
  if (!res.ok) throw new Error('image unavailable')
  const svg = await res.text()
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.decoding = 'sync'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode failed'))
      img.src = blobUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.drawImage(img, 0, 0, 1080, 1080)
    const png = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = png
    a.download = `shutap-joke-${cardId.slice(0, 8)}.png`
    a.click()
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}
