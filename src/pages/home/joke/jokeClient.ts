// Browser-side plumbing for the joke-card surface. Holds no authority: the
// tier, the card text and the export size all come from the server. What
// happens here is only rasterising, packaging and handing the file over.
import { phCapture } from '@/lib/posthog'
import type { JokeCard, JokeTier } from '@/lib/jokes/deck'

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

/** Every joke event carries the tier. Situation text never rides along. */
export function jokeTrack(name: string, tier: JokeTier, props: Record<string, unknown> = {}): void {
  void phCapture(name, { ...props, tier })
}

/** The shareable link for a card — always the marked, story-size render. */
export function cardImageUrl(cardId: string): string {
  return `/api/public/joke-card?id=${encodeURIComponent(cardId)}`
}

/** The caption the share sheet opens with, ready to paste and free to edit. */
export function defaultCaption(card: JokeCard): string {
  return `“${card.text}”\n→ shutap.com`
}

// ───────────────────────── rasterising ─────────────────────────

/** Draw a server-authored SVG document into a PNG blob at its own size. */
export async function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('decode failed'))
      img.src = blobUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas')
    ctx.drawImage(img, 0, 0, width, height)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoking immediately can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

// ───────────────────────── the set, as one file ─────────────────────────
//
// Members save all three in one tap, so the three PNGs are packed into a
// single .zip. Stored, never deflated: the payload is already-compressed PNG,
// so deflate would buy nothing and cost a dependency.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** MS-DOS packed date/time, which is what a zip entry stores. */
function dosStamp(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

export async function zipStored(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const encoder = new TextEncoder()
  const stamp = dosStamp(new Date())
  const locals: BlobPart[] = []
  const central: BlobPart[] = []
  let offset = 0

  for (const file of files) {
    const name = encoder.encode(file.name)
    const bytes = new Uint8Array(await file.blob.arrayBuffer())
    const crc = crc32(bytes)

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true) // local file header
    local.setUint16(4, 20, true) // version needed
    local.setUint16(6, 0x0800, true) // UTF-8 names
    local.setUint16(8, 0, true) // stored
    local.setUint16(10, stamp.time, true)
    local.setUint16(12, stamp.date, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, bytes.length, true)
    local.setUint32(22, bytes.length, true)
    local.setUint16(26, name.length, true)
    local.setUint16(28, 0, true) // no extra field
    locals.push(local.buffer, name, bytes)

    const entry = new DataView(new ArrayBuffer(46))
    entry.setUint32(0, 0x02014b50, true) // central directory header
    entry.setUint16(4, 20, true)
    entry.setUint16(6, 20, true)
    entry.setUint16(8, 0x0800, true)
    entry.setUint16(10, 0, true)
    entry.setUint16(12, stamp.time, true)
    entry.setUint16(14, stamp.date, true)
    entry.setUint32(16, crc, true)
    entry.setUint32(20, bytes.length, true)
    entry.setUint32(24, bytes.length, true)
    entry.setUint16(28, name.length, true)
    entry.setUint32(42, offset, true)
    central.push(entry.buffer, name)

    offset += 30 + name.length + bytes.length
  }

  const centralSize = central.reduce(
    (n, part) => n + (part instanceof ArrayBuffer ? part.byteLength : (part as Uint8Array).length),
    0,
  )
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true) // end of central directory
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, centralSize, true)
  end.setUint32(16, offset, true)

  return new Blob([...locals, ...central, end.buffer], { type: 'application/zip' })
}
