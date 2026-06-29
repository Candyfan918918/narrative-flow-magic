/* Scan share card — polished 9:16 portrait modal opened from the Scan result
   screen (and any persisted scan room). Makes ZERO model calls; renders
   entirely from the persisted scan situation record (score, signature, read,
   factors, pillar). Band word + colour + gauge fill + marker position are all
   DERIVED from score — never hardcoded per-card. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'

export interface ScanRecord {
  score: number
  signature: string | null
  read?: string | null
  factors?: string[] | null
  pillar?: string | null
  url?: string
}

interface Band {
  key: 'settling' | 'sitting' | 'weighing' | 'heavy' | 'consuming'
  word: string
  color: string
}

function deriveBand(score: number): Band {
  if (score < 200) return { key: 'settling', word: 'settling', color: '#9e8f9c' }
  if (score < 400) return { key: 'sitting', word: 'sitting with it', color: '#7F77DD' }
  if (score < 600) return { key: 'weighing', word: 'weighing', color: '#c87c4a' }
  if (score < 800) return { key: 'heavy', word: 'heavy & loud', color: '#e7548a' }
  return { key: 'consuming', word: 'consuming', color: '#c1216b' }
}

const SPECTRUM = 'linear-gradient(90deg,#9e8f9c 0%,#7F77DD 30%,#c87c4a 55%,#e7548a 78%,#c1216b 100%)'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function caption(rec: ScanRecord): string {
  const sig = (rec.signature || '').trim() || 'a situation'
  return `turns out my situation is a "${rec.score} · ${sig}" — take yours → shutap.com`
}

function copyToClipboard(text: string): Promise<void> {
  try {
    return navigator.clipboard.writeText(text)
  } catch {
    return Promise.resolve()
  }
}

const LOGOS: Record<string, string> = {
  sms: '<svg viewBox="0 0 24 24" fill="#fff" style="width:16px;height:16px"><path d="M12 2C6.5 2 2 5.8 2 10.5c0 2.5 1.3 4.7 3.3 6.2-.2 1.4-.9 2.8-1.9 3.9 1.7-.2 3.4-.8 4.8-1.7 1.2.3 2.5.5 3.8.5 5.5 0 10-3.8 10-8.5S17.5 2 12 2z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="#fff" style="width:14px;height:14px"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="#fff" style="width:16px;height:16px"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9 3.72 3.72 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 1116 12a4 4 0 01-4 4zm6.4-10.4a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="#fff" style="width:15px;height:15px"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="#fff" style="width:16px;height:16px"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
}

export function ScanShareCard({
  record,
  onClose,
  toast,
}: {
  record: ScanRecord
  onClose: () => void
  toast: (m: string) => void
}) {
  const band = useMemo(() => deriveBand(record.score), [record.score])
  const reduced = useMemo(prefersReducedMotion, [])
  const cardRef = useRef<HTMLDivElement>(null)
  const url = record.url || (typeof window !== 'undefined' ? window.location.origin + '/' : 'https://shutap.com/')

  // count-up
  const [shown, setShown] = useState(reduced ? record.score : 0)
  useEffect(() => {
    if (reduced) {
      setShown(record.score)
      return
    }
    const start = performance.now()
    const dur = 1100
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(record.score * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [record.score, reduced])

  // gauge geometry
  const R = 118
  const STROKE = 10
  const CIRC = 2 * Math.PI * R
  const pct = Math.max(0, Math.min(1, record.score / 999))
  const dash = CIRC * pct
  const markerPct = pct * 100

  const cap = caption(record)
  const enc = encodeURIComponent

  const onShare = async (kind: string) => {
    const text = cap
    if (kind === 'sms') {
      window.open('sms:?&body=' + enc(text), '_blank')
      return
    }
    if (kind === 'x') {
      window.open('https://twitter.com/intent/tweet?text=' + enc(text) + '&url=' + enc(url), '_blank')
      return
    }
    if (kind === 'whatsapp') {
      window.open('https://wa.me/?text=' + enc(text + '\n' + url), '_blank')
      return
    }
    if (kind === 'instagram') {
      await copyToClipboard(text + '\n' + url)
      toast('caption copied — paste it on your story/post')
      window.open('https://instagram.com', '_blank')
      return
    }
    if (kind === 'tiktok') {
      await copyToClipboard(text + '\n' + url)
      toast('caption copied — paste it on your story/post')
      window.open('https://tiktok.com', '_blank')
      return
    }
    if (kind === 'copy') {
      await copyToClipboard(text + '\n' + url)
      toast('copied to clipboard')
      return
    }
    if (kind === 'download') {
      const node = cardRef.current
      if (!node) return
      try {
        const png = await toPng(node, { pixelRatio: 2, cacheBust: true })
        const a = document.createElement('a')
        a.href = png
        a.download = `shutap-scan-${record.score}.png`
        a.click()
        toast('image saved')
      } catch {
        toast('could not export image')
      }
    }
  }

  const targets: [string, string][] = [
    ['sms', 'Text'],
    ['x', 'X'],
    ['instagram', 'Instagram'],
    ['tiktok', 'TikTok'],
    ['whatsapp', 'WhatsApp'],
    ['copy', 'copy'],
    ['download', 'save image'],
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(8,4,10,.72)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: 420,
          width: '100%',
        }}
      >
        {/* THE CARD — 9:16 */}
        <div
          ref={cardRef}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '9 / 16',
            borderRadius: 22,
            overflow: 'hidden',
            background: 'radial-gradient(120% 90% at 50% 0%, #2a0d18 0%, #150810 55%, #0b050a 100%)',
            border: '.5px solid rgba(255,255,255,.10)',
            boxShadow: '0 30px 80px rgba(0,0,0,.55)',
            color: '#f7e8f0',
            fontFamily: 'Sora,sans-serif',
          }}
        >
          {/* drifting radial aura */}
          <div
            style={{
              position: 'absolute',
              inset: '-20%',
              background: `radial-gradient(closest-side, ${band.color}66, transparent 70%)`,
              filter: 'blur(40px)',
              animation: reduced ? undefined : 'scanAuraDrift 9s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          {/* conic glow */}
          <div
            style={{
              position: 'absolute',
              top: '38%',
              left: '50%',
              width: 380,
              height: 380,
              marginLeft: -190,
              marginTop: -190,
              background: `conic-gradient(from 0deg, transparent, ${band.color}22, transparent, ${band.color}33, transparent)`,
              borderRadius: '50%',
              filter: 'blur(8px)',
              animation: reduced ? undefined : 'scanConicSpin 14s linear infinite',
              pointerEvents: 'none',
              opacity: 0.85,
            }}
          />
          {/* sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,.06) 48%, transparent 60%)',
              animation: reduced ? undefined : 'scanSheen 6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          {/* film grain */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.06,
              mixBlendMode: 'overlay',
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
              pointerEvents: 'none',
            }}
          />

          {/* content */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '22px 22px 26px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg viewBox="0 0 56 56" style={{ width: 22, height: 22 }}>
                  <defs>
                    <linearGradient id="scEye" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fdf0f5" />
                      <stop offset="100%" stopColor="#f7b8d4" />
                    </linearGradient>
                  </defs>
                  <rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#scEye)" />
                  <rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#scEye)" />
                  <ellipse cx="21" cy="29" rx="4" ry="5" fill="#1a0a12">
                    {!reduced && (
                      <animate attributeName="ry" values="5;0.6;5" dur="4s" repeatCount="indefinite" />
                    )}
                  </ellipse>
                  <ellipse cx="35" cy="29" rx="4" ry="5" fill="#1a0a12">
                    {!reduced && (
                      <animate attributeName="ry" values="5;0.6;5" dur="4s" repeatCount="indefinite" />
                    )}
                  </ellipse>
                </svg>
                <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '-.02em', color: '#f7e8f0' }}>
                  shut<span style={{ color: '#e7548a' }}>ap</span>
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'Sora,sans-serif',
                  fontWeight: 800,
                  fontSize: 10,
                  letterSpacing: '.22em',
                  color: band.color,
                }}
              >
                SCAN
              </span>
            </div>

            {/* GAUGE */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <svg
                viewBox={`0 0 ${(R + STROKE) * 2} ${(R + STROKE) * 2}`}
                style={{ width: '78%', maxWidth: 280, transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx={R + STROKE}
                  cy={R + STROKE}
                  r={R}
                  fill="none"
                  stroke="rgba(255,255,255,.08)"
                  strokeWidth={STROKE}
                />
                <circle
                  cx={R + STROKE}
                  cy={R + STROKE}
                  r={R}
                  fill="none"
                  stroke={band.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRC - dash}`}
                  style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Sora,sans-serif',
                    fontWeight: 800,
                    fontSize: 'clamp(58px,17vw,84px)',
                    lineHeight: 1,
                    letterSpacing: '-.04em',
                    color: '#f7e8f0',
                  }}
                >
                  {shown}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: 'Sora,sans-serif',
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: band.color,
                  }}
                >
                  {band.word}
                </div>
              </div>
            </div>

            {/* SIGNATURE BLOCK */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {record.signature && (
                <div
                  style={{
                    fontFamily: 'Sora,sans-serif',
                    fontWeight: 800,
                    fontSize: 22,
                    lineHeight: 1.2,
                    letterSpacing: '-.02em',
                    color: '#f7e8f0',
                    maxWidth: '90%',
                  }}
                >
                  {record.signature}
                </div>
              )}
              {record.pillar && (
                <span
                  style={{
                    fontFamily: 'Sora,sans-serif',
                    fontWeight: 700,
                    fontSize: 9.5,
                    letterSpacing: '.16em',
                    textTransform: 'uppercase',
                    color: band.color,
                    background: band.color + '22',
                    border: '.5px solid ' + band.color + '55',
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}
                >
                  {record.pillar}
                </span>
              )}
              {record.read && (
                <div
                  style={{
                    fontFamily: 'Newsreader,serif',
                    fontStyle: 'italic',
                    fontSize: 14.5,
                    lineHeight: 1.45,
                    color: '#e8d3df',
                    maxWidth: '26ch',
                  }}
                >
                  {record.read}
                </div>
              )}
            </div>

            {/* SPECTRUM BAR */}
            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  position: 'relative',
                  height: 6,
                  borderRadius: 999,
                  background: SPECTRUM,
                  boxShadow: 'inset 0 0 0 .5px rgba(255,255,255,.18)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${markerPct}%`,
                    width: 14,
                    height: 14,
                    marginLeft: -7,
                    marginTop: -7,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: `0 0 0 2px ${band.color}, 0 4px 10px rgba(0,0,0,.35)`,
                    transition: 'left 1.1s cubic-bezier(.2,.8,.2,1)',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 10,
                  textAlign: 'center',
                  fontFamily: 'Newsreader,serif',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: '#c9a3b6',
                }}
              >
                what's your number? · shutap.com
              </div>
            </div>
          </div>
        </div>

        {/* SHARE TARGETS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {targets.map(([k, label]) => (
            <button
              key={k}
              onClick={() => onShare(k)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 14px',
                borderRadius: 999,
                border: '.5px solid rgba(255,255,255,.18)',
                background:
                  k === 'instagram'
                    ? 'linear-gradient(135deg,#feda75,#d62976 45%,#962fbf 75%,#4f5bd5)'
                    : k === 'x' || k === 'tiktok'
                      ? '#0b080f'
                      : k === 'whatsapp'
                        ? '#25D366'
                        : k === 'sms'
                          ? '#34C759'
                          : 'rgba(255,255,255,.12)',
                color: '#fff',
                fontFamily: 'Sora,sans-serif',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: LOGOS[k] || '' }} />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#c9a3b6',
            fontFamily: 'Newsreader,serif',
            fontStyle: 'italic',
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          close
        </button>
      </div>

      <style>{`
        @keyframes scanAuraDrift {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(4%,-3%) scale(1.06); }
        }
        @keyframes scanConicSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes scanSheen {
          0%,100% { transform: translateX(-30%); opacity: 0; }
          45% { opacity: 1; }
          55% { opacity: 1; }
          100% { transform: translateX(60%); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
