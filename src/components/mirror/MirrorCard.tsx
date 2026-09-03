// MirrorCard — renders a single pattern row from mirror_patterns.
// Every visible value comes from DB fields; no live model call.
// Always renders complete + upright; animations are progressive enhancement.
import { useEffect, useState } from 'react'
import {
  DISTRICT_SIGIL,
  DISTRICT_LABEL,
  RARITY_NUMERAL,
  type District,
  type Rarity,
} from '@/lib/agents/mirror-guards'
import { EyeMark, ShutapWordmark } from '@/components/EyeMark'

const DISTRICT_PALETTE: Record<District, { ink: string; glow: string }> = {
  self: { ink: '#C8B6FF', glow: 'rgba(200,182,255,.22)' },
  career: { ink: '#FFD479', glow: 'rgba(255,212,121,.22)' },
  love: { ink: '#FF9AC5', glow: 'rgba(255,154,197,.22)' },
  family: { ink: '#9FE6B5', glow: 'rgba(159,230,181,.22)' },
  social: { ink: '#7FE0FF', glow: 'rgba(127,224,255,.22)' },
}

const SOURCE_GLYPH: Record<string, string> = {
  spill: '🗯', scan: '📸', comments: '💬', likes: '♥', follows: '✦', browse: '👁',
}

export type MirrorPatternView = {
  id: string
  name: string
  emoji: string
  district: District
  rarity: Rarity
  state: 'active' | 'ruin'
  insight: string
  punch: string
  record: string
  count: number
  depth: number
  trend: number[]
  trend_dir: 'rising' | 'steady' | 'cooling' | 'dormant'
  sources: Record<string, number>
  first_seen: string
  last_seen: string
}

function DepthWheel({ depth, emoji, dir }: { depth: number; emoji: string; dir: string }) {
  const r = 42
  const C = 2 * Math.PI * r
  const pct = Math.min(1, Math.max(0, depth / 5))
  const dash = C * pct
  const orbitDur = dir === 'rising' ? '6s' : dir === 'cooling' ? '14s' : dir === 'dormant' ? '40s' : '10s'
  return (
    <div style={{ position: 'relative', width: 112, height: 112 }} aria-hidden>
      <svg viewBox="0 0 100 100" width={112} height={112}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={r}
          fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: 36, lineHeight: 1, filter: 'drop-shadow(0 2px 12px rgba(0,0,0,.4))',
        }}
      >
        {emoji}
      </div>
      <div
        style={{
          position: 'absolute', inset: 0, animation: `mirror-orbit ${orbitDur} linear infinite`,
          opacity: dir === 'dormant' ? 0.25 : 0.9,
        }}
      >
        <div style={{
          position: 'absolute', left: '50%', top: 0, width: 6, height: 6, marginLeft: -3,
          borderRadius: 999, background: 'currentColor', boxShadow: '0 0 10px currentColor',
        }} />
      </div>
    </div>
  )
}

function TrendChart({ trend, color }: { trend: number[]; color: string }) {
  const pts = (trend ?? []).slice(-7)
  if (pts.length < 2) return null
  const max = Math.max(1, ...pts.map(Number))
  const w = 220, h = 56, pad = 6
  const step = (w - pad * 2) / (pts.length - 1)
  const xy = pts.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - Number(v) / max) * (h - pad * 2)
    return [x, y] as const
  })
  const d = xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = xy[xy.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden>
      <defs>
        <linearGradient id={`tg-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${last[0]} ${h - pad} L ${xy[0][0]} ${h - pad} Z`} fill={`url(#tg-${color.replace(/[^a-z0-9]/gi, '')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color}>
        <animate attributeName="r" values="3.5;5.5;3.5" dur="2.4s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function SignalBar({ sources }: { sources: Record<string, number> }) {
  const order = ['spill', 'scan', 'comments', 'likes', 'follows', 'browse']
  const total = order.reduce((a, k) => a + Number(sources?.[k] ?? 0), 0)
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {order.map((k) => {
          const n = Number(sources?.[k] ?? 0)
          return (
            <span key={k} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 999,
              background: n > 0 ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.03)',
              border: '.5px solid rgba(255,255,255,.08)',
              fontFamily: 'Sora, sans-serif', fontSize: 11, color: n > 0 ? '#fff' : 'rgba(255,255,255,.35)',
            }}>
              <span style={{ fontSize: 12 }}>{SOURCE_GLYPH[k]}</span>
              <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
            </span>
          )
        })}
      </div>
      <div style={{
        marginTop: 8, fontFamily: 'Sora, sans-serif', fontSize: 10,
        color: 'rgba(255,255,255,.5)', letterSpacing: '.14em',
      }}>
        SYNTHESIZED FROM {total} SIGNALS · 6 SURFACES
      </div>
    </div>
  )
}

function CountTick({ value }: { value: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = 800
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setV(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</span>
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const h = ms / 36e5
  if (h < 1) return 'minutes ago'
  if (h < 24) return `${Math.round(h)}h ago`
  const d = h / 24
  if (d < 30) return `${Math.round(d)}d ago`
  return `${Math.round(d / 30)}mo ago`
}

export function MirrorCard({ p }: { p: MirrorPatternView }) {
  const pal = DISTRICT_PALETTE[p.district] ?? DISTRICT_PALETTE.self
  const isLegendary = p.rarity === 'legendary'
  const isRuin = p.state === 'ruin'
  const ink = isRuin ? 'rgba(180,200,190,.65)' : pal.ink
  const frameColor = isLegendary ? '#FFD479' : 'rgba(255,255,255,.12)'
  const trendLabel: Record<string, string> = {
    rising: 'rising', cooling: 'cooling', steady: 'steady', dormant: 'dormant',
  }

  return (
    <article
      style={{
        position: 'relative',
        borderRadius: 22,
        padding: 22,
        background: isRuin
          ? 'linear-gradient(160deg, #1a1f1d 0%, #0e1311 100%)'
          : `linear-gradient(160deg, #1c0e18 0%, #0e0710 100%)`,
        border: `1px solid ${frameColor}`,
        boxShadow: isLegendary
          ? '0 0 0 1px rgba(255,212,121,.35), 0 20px 60px rgba(255,212,121,.12), inset 0 0 80px rgba(255,212,121,.06)'
          : '0 12px 40px rgba(0,0,0,.5)',
        color: '#fff',
        overflow: 'hidden',
        filter: isRuin ? 'saturate(.55)' : undefined,
      }}
    >
      {/* aura */}
      <div aria-hidden style={{
        position: 'absolute', inset: -1, pointerEvents: 'none',
        background: `radial-gradient(120% 60% at 50% 0%, ${pal.glow}, transparent 60%)`,
      }} />

      {/* chrome row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <span style={{
          fontFamily: 'Sora, sans-serif', fontSize: 11, fontWeight: 800, letterSpacing: '.22em',
          color: isLegendary ? '#FFD479' : 'rgba(255,255,255,.55)',
        }}>
          {RARITY_NUMERAL[p.rarity]} · {p.rarity.toUpperCase()}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Sora, sans-serif',
          fontSize: 11, letterSpacing: '.14em', color: ink,
        }}>
          <span style={{ fontSize: 14 }}>{DISTRICT_SIGIL[p.district]}</span>
          {DISTRICT_LABEL[p.district].toUpperCase()}
        </span>
      </div>

      {/* name */}
      <h3 style={{
        fontFamily: "'Newsreader', serif", fontStyle: 'italic', fontWeight: 500,
        fontSize: 26, lineHeight: 1.15, margin: '14px 0 4px', color: '#fff', position: 'relative',
      }}>
        {p.name}
      </h3>
      {p.insight && (
        <p style={{
          margin: 0, fontFamily: 'Sora, sans-serif', fontSize: 12, color: 'rgba(255,255,255,.55)',
          letterSpacing: '.02em',
        }}>
          {p.insight}
        </p>
      )}

      {/* wheel + trend */}
      <div style={{
        display: 'grid', gridTemplateColumns: '112px 1fr', gap: 18, marginTop: 18,
        alignItems: 'center', color: ink, position: 'relative',
      }}>
        <DepthWheel depth={p.depth} emoji={p.emoji || '✨'} dir={p.trend_dir} />
        <div>
          <TrendChart trend={p.trend} color={ink} />
          <div style={{
            marginTop: 6, fontFamily: 'Sora, sans-serif', fontSize: 11,
            color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', display: 'flex', gap: 12,
          }}>
            <span>DEPTH {p.depth}/5</span>
            <span>·</span>
            <span style={{ color: ink }}>{trendLabel[p.trend_dir] ?? 'steady'}</span>
            <span>·</span>
            <span>{timeAgo(p.last_seen)}</span>
          </div>
        </div>
      </div>

      {/* signals */}
      <div style={{ marginTop: 18, position: 'relative' }}>
        <SignalBar sources={p.sources ?? {}} />
      </div>

      {/* count + punch */}
      <div style={{
        marginTop: 18, paddingTop: 16, borderTop: '.5px solid rgba(255,255,255,.08)', position: 'relative',
      }}>
        <div style={{
          fontFamily: 'Sora, sans-serif', fontSize: 11, letterSpacing: '.14em',
          color: 'rgba(255,255,255,.45)', marginBottom: 8,
        }}>
          <CountTick value={p.count} /> OBSERVATIONS · FIRST SEEN {timeAgo(p.first_seen)}
        </div>
        <p style={{
          margin: 0, fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 19,
          lineHeight: 1.35, color: '#fff',
        }}>
          {p.punch || p.insight || 'still forming.'}
        </p>
        {p.record && (
          <div style={{
            marginTop: 14, fontFamily: 'Sora, sans-serif', fontSize: 10, letterSpacing: '.22em',
            color: 'rgba(255,255,255,.4)', textTransform: 'uppercase',
          }}>
            {p.record}
          </div>
        )}
        {/* footer stamp — full-brightness brand mark */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 7, marginTop: 16,
        }}>
          <EyeMark w={24} />
          <ShutapWordmark size={13} ink="#f7e8f0" accent="#e7548a" letterSpacing="-.02em" />
          <span style={{
            width: 3, height: 3, borderRadius: '50%', background: '#7a5f6c',
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 8.5,
            letterSpacing: '.24em', textTransform: 'uppercase', color: '#8a6c7a',
          }}>THE MIRROR</span>
        </div>
      </div>
    </article>
  )
}
