// The Mirror — dark tarot surface. Every value comes from the user's
// mirror_patterns rows (or the read-only demo cast for logged-out / forming
// previews). Opens issue zero model calls; the punch line is a DB field.
// Cinematic reveal is progressive enhancement: the final upright card is
// always rendered first, then animations play over it.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import {
  listMirrorPatterns,
  listDemoPatterns,
} from '@/lib/mirror-pipeline.functions'
import { runMirrorCrossRead } from '@/lib/agents/mirror.functions'
import {
  DISTRICT_LABEL,
  DISTRICT_SIGIL,
  RARITY_NUMERAL,
  type District,
  type Rarity,
} from '@/lib/agents/mirror-guards'
import { getAlias, rememberReturnTo, signOut as doSignOut, isAdmin as getIsAdmin } from '@/lib/auth'
import { supabase } from '@/integrations/supabase/client'
import { MirrorShareSheet } from '@/components/MirrorShareSheet'

// Accounts allowed to preview the seeded demo cast in their own Mirror.
// Everyone else sees the real (possibly empty) Forming state with CTAs.
const DEMO_PREVIEW_USER_IDS = new Set<string>([
  '28376810-e42d-4235-b70b-bba32bab6ecb',
])
import type { Alias } from '@/data/types'

/* ─────────────── design tokens ─────────────── */
const BG = '#100810'
const INK = '#f7e8f0'
const MUTED = '#c4a0b2'
const MUTED_2 = '#9b7d8c'
const MUTED_3 = '#7a5f6c'
const GOLD = '#e9c06a'
const RUIN_MOSS = '#6f7a5e'

const DISTRICT_COLOR: Record<District, string> = {
  self: '#e7548a',
  career: '#7F77DD',
  love: '#c1216b',
  family: '#c87c4a',
  social: '#5B8A5E',
}

const SOURCE_GLYPH: Record<string, string> = {
  spill: '🫧',
  scan: '✨',
  comments: '💌',
  likes: '🫶',
  follows: '🌟',
  browse: '👀',
}
const SOURCE_COLOR: Record<string, string> = {
  spill: '#e7548a',
  scan: '#c87c4a',
  comments: '#7F77DD',
  likes: '#c1216b',
  follows: '#5B8A5E',
  browse: '#c4a0b2',
}

const DISTRICTS: District[] = ['self', 'career', 'love', 'family', 'social']

/* ─────────────── types ─────────────── */
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

/* ─────────────── small utils ─────────────── */
function timeAgo(iso: string): string {
  if (!iso) return 'just now'
  const ms = Date.now() - new Date(iso).getTime()
  const h = ms / 36e5
  if (h < 1) return `${Math.max(1, Math.round(ms / 60000))}m ago`
  if (h < 24) return `${Math.round(h)}h ago`
  const d = h / 24
  if (d < 30) return `${Math.round(d)}d ago`
  return `${Math.round(d / 30)}mo ago`
}

function trendArrow(dir: string) {
  if (dir === 'rising') return '🔥'
  if (dir === 'cooling') return '🧊'
  if (dir === 'dormant') return '💤'
  return '😐'
}
function trendColor(dir: string) {
  if (dir === 'rising') return '#e7548a'
  if (dir === 'cooling') return '#7F77DD'
  if (dir === 'dormant') return MUTED_3
  return '#c4a0b2'
}

/* ─────────────── dark header (mirror-only) ─────────────── */
function MirrorHeader() {
  const navigate = useNavigate()
  const [alias, setAlias] = useState<Alias | null>(() => getAlias())
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const admin = getIsAdmin()
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])
  const join = () => {
    rememberReturnTo(window.location.href)
    navigate('/welcome')
  }
  const out = () => {
    setOpen(false)
    doSignOut()
    setAlias(null)
  }
  const item: React.CSSProperties = {
    display: 'block',
    padding: '10px 12px',
    borderRadius: 10,
    fontFamily: "'Newsreader',serif",
    fontStyle: 'italic',
    fontSize: 14,
    color: INK,
    textDecoration: 'none',
    cursor: 'pointer',
  }
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(16,8,16,.82)',
        backdropFilter: 'blur(18px)',
        borderBottom: '.5px solid rgba(255,255,255,.08)',
      }}
    >
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '11px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: INK }}>
          <span style={{ width: 30, height: 22, display: 'block' }}>
            <svg viewBox="0 0 140 96" fill="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
              <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
              <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)" />
              <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)" />
            </svg>
          </span>
          <span style={{
            fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 19,
            letterSpacing: '-.04em', color: INK,
          }}>
            shut<span style={{ color: '#e7548a' }}>ap</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/stream" style={{
            fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14,
            color: MUTED, textDecoration: 'none', padding: '6px 12px',
          }}>rooms</Link>
          <Link to="/halls" style={{
            fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14,
            color: MUTED, textDecoration: 'none', padding: '6px 12px',
          }}>halls</Link>
          <div ref={ref} style={{ position: 'relative' }}>
            {alias ? (
              <>
                <div
                  role="button"
                  onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'rgba(255,255,255,.04)',
                    border: '.5px solid rgba(255,255,255,.10)',
                    borderRadius: 999, padding: '5px 12px 5px 5px', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#f060a0,#890041)',
                    display: 'grid', placeItems: 'center', fontSize: 14, flex: 'none',
                  }}>{alias.emoji || '🐣'}</span>
                  <span style={{
                    fontFamily: "'Newsreader',serif", fontStyle: 'italic',
                    fontSize: 13, color: INK,
                  }}>{alias.name || ''}</span>
                </div>
                {open && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 9px)', right: 0,
                    width: 220,
                    background: '#1a0d18',
                    border: '.5px solid rgba(255,255,255,.10)',
                    borderRadius: 16, padding: 7, zIndex: 70,
                    boxShadow: '0 24px 50px -16px rgba(0,0,0,.6)',
                  }}>
                    <Link to="/profile" style={item} onClick={() => setOpen(false)}>your profile</Link>
                    <Link to="/profile#settings" style={item} onClick={() => setOpen(false)}>settings</Link>
                    <div role="button" style={{ ...item, color: '#e7548a' }} onClick={() => { setOpen(false); navigate('/#spill') }}>spill it →</div>
                    <Link to="/mirror" style={{ ...item, color: GOLD }} onClick={() => setOpen(false)}>the mirror ✦</Link>
                    {admin && <Link to="/admin" style={item} onClick={() => setOpen(false)}>admin</Link>}
                    <div style={{ height: '.5px', background: 'rgba(255,255,255,.08)', margin: '6px 0' }} />
                    <div role="button" style={{ ...item, color: MUTED_2 }} onClick={out}>sign out</div>
                  </div>
                )}
              </>
            ) : (
              <div role="button" onClick={join} style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#e7548a', color: '#fff', borderRadius: 999,
                padding: '9px 18px', fontFamily: "'Sora',sans-serif",
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}>join →</div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/* ─────────────── depth wheel ─────────────── */
function DepthWheel({
  depth, emoji, dir, color, size = 132, animate,
}: { depth: number; emoji: string; dir: string; color: string; size?: number; animate: boolean }) {
  const r = 52
  const C = 2 * Math.PI * r
  const target = C * Math.min(1, Math.max(0, depth / 5))
  const [dash, setDash] = useState(animate ? 0 : target)
  useEffect(() => {
    if (!animate) { setDash(target); return }
    let raf = 0
    const t0 = performance.now()
    const dur = 1100
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDash(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, animate])
  const orbitDur = dir === 'rising' ? '5s' : dir === 'cooling' ? '14s' : dir === 'dormant' ? '40s' : '9s'
  return (
    <div style={{ position: 'relative', width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform="rotate(-90 60 60)"
          style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        fontSize: Math.round(size * 0.36), lineHeight: 1,
        filter: `drop-shadow(0 0 14px ${color}aa)`,
        animation: 'mirror-float 4.6s ease-in-out infinite',
      }}>{emoji}</div>
      <div style={{
        position: 'absolute', inset: 0,
        animation: `mirror-orbit ${orbitDur} linear infinite`,
        opacity: dir === 'dormant' ? 0.3 : 0.95,
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: 2, width: 7, height: 7, marginLeft: -3.5,
          borderRadius: 999, background: color, boxShadow: `0 0 12px ${color}`,
        }} />
      </div>
    </div>
  )
}

/* ─────────────── trend chart ─────────────── */
function TrendChart({ trend, color, animate }: { trend: number[]; color: string; animate: boolean }) {
  const pts = (trend ?? []).slice(-7)
  const w = 280, h = 70, pad = 8
  if (pts.length < 2) {
    return <div style={{ height: h, fontFamily: "'Sora',sans-serif", fontSize: 10, color: MUTED_3, letterSpacing: '.18em', textAlign: 'center', paddingTop: 24 }}>NOT ENOUGH SIGNAL YET</div>
  }
  const max = Math.max(1, ...pts.map(Number))
  const step = (w - pad * 2) / (pts.length - 1)
  const xy = pts.map((v, i) => {
    const x = pad + i * step
    const y = pad + (1 - Number(v) / max) * (h - pad * 2)
    return [x, y] as const
  })
  const d = xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = xy[xy.length - 1]
  const id = `tg-${color.replace(/[^a-z0-9]/gi, '')}`
  const pathRef = useRef<SVGPathElement>(null)
  useEffect(() => {
    if (!animate || !pathRef.current) return
    const len = pathRef.current.getTotalLength()
    pathRef.current.style.strokeDasharray = `${len}`
    pathRef.current.style.strokeDashoffset = `${len}`
    pathRef.current.getBoundingClientRect()
    pathRef.current.style.transition = 'stroke-dashoffset 1100ms cubic-bezier(.2,.7,.2,1)'
    pathRef.current.style.strokeDashoffset = '0'
  }, [animate, d])
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-hidden style={{ display: 'block' }}>
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".45" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${last[0]} ${h - pad} L ${xy[0][0]} ${h - pad} Z`} fill={`url(#${id})`} />
        <path ref={pathRef} d={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}77)` }} />
        <circle cx={last[0]} cy={last[1]} r="4" fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
          <animate attributeName="r" values="3.5;6;3.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Sora',sans-serif", fontSize: 9, color: MUTED_3, letterSpacing: '.18em', marginTop: 2 }}>
        <span>7 WEEKS AGO</span><span>THIS WEEK</span>
      </div>
    </div>
  )
}

/* ─────────────── signal bar ─────────────── */
function SignalBar({ sources, animate }: { sources: Record<string, number>; animate: boolean }) {
  const order = ['spill', 'scan', 'comments', 'likes', 'follows', 'browse']
  const total = order.reduce((a, k) => a + Number(sources?.[k] ?? 0), 0)
  return (
    <div>
      <div style={{
        display: 'flex', width: '100%', height: 10, borderRadius: 999, overflow: 'hidden',
        background: 'rgba(255,255,255,.05)', border: '.5px solid rgba(255,255,255,.06)',
      }}>
        {order.map((k, i) => {
          const v = Number(sources?.[k] ?? 0)
          const pct = total > 0 ? (v / total) * 100 : 0
          return (
            <div key={k} style={{
              width: animate ? '0%' : `${pct}%`,
              background: SOURCE_COLOR[k] ?? MUTED_2,
              transition: `width 900ms cubic-bezier(.2,.7,.2,1) ${i * 60}ms`,
              opacity: v > 0 ? 0.95 : 0.15,
            }} />
          )
        })}
      </div>
      <div style={{
        marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap',
        fontFamily: "'Sora',sans-serif", fontSize: 10, color: MUTED_2, letterSpacing: '.06em',
      }}>
        {order.map((k) => {
          const v = Number(sources?.[k] ?? 0)
          return (
            <span key={k} style={{ opacity: v > 0 ? 1 : 0.35, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <span style={{ color: SOURCE_COLOR[k] }}>{SOURCE_GLYPH[k]}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: INK }}>{v}</span>
            </span>
          )
        })}
      </div>
      <div style={{
        marginTop: 6, fontFamily: "'Sora',sans-serif", fontSize: 9.5,
        color: MUTED_3, letterSpacing: '.20em',
      }}>
        SYNTHESIZED FROM {total} SIGNALS · 6 SURFACES
      </div>
    </div>
  )
}

/* ─────────────── count tick ─────────────── */
function CountTick({ value, animate, style }: { value: number; animate: boolean; style?: React.CSSProperties }) {
  const [v, setV] = useState(animate ? 0 : value)
  useEffect(() => {
    if (!animate) { setV(value); return }
    let raf = 0
    const t0 = performance.now()
    const dur = 1000
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      setV(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, animate])
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{v}</span>
}

/* ─────────────── the big tarot card ─────────────── */
function TarotCard({
  p, animate, innerRef,
}: { p: MirrorPatternView; animate: boolean; innerRef?: React.Ref<HTMLDivElement> }) {
  const color = p.state === 'ruin' ? RUIN_MOSS : DISTRICT_COLOR[p.district]
  const isLegendary = p.rarity === 'legendary' && p.state !== 'ruin'
  const isRuin = p.state === 'ruin'
  const bg = isRuin
    ? 'radial-gradient(125% 80% at 50% 0%, #2a2e22, #1a1c16 58%, #15140f)'
    : `radial-gradient(125% 80% at 50% 0%, ${color}38, #1c0d16 58%, #140810)`
  const border = isLegendary ? GOLD : `${color}66`
  return (
    <article
      ref={innerRef}
      style={{
        position: 'relative', borderRadius: 22, overflow: 'hidden',
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: isLegendary
          ? `0 0 0 1px ${GOLD}55, 0 0 60px ${GOLD}33, 0 20px 60px rgba(0,0,0,.6)`
          : `0 24px 60px -10px rgba(0,0,0,.7), 0 0 40px ${color}22`,
        color: INK,
        padding: '16px 18px 14px',
        filter: isRuin ? 'saturate(.55) grayscale(.25)' : undefined,
      }}
    >
      {/* inner ornamental frame */}
      <div aria-hidden style={{
        position: 'absolute', inset: 6, borderRadius: 18, pointerEvents: 'none',
        border: `.5px solid ${isLegendary ? `${GOLD}66` : 'rgba(255,255,255,.06)'}`,
      }} />
      {/* aura */}
      <div aria-hidden style={{
        position: 'absolute', inset: -20, pointerEvents: 'none',
        background: `radial-gradient(50% 40% at 50% 0%, ${color}33, transparent 65%)`,
        animation: 'mirror-aura 6s ease-in-out infinite',
      }} />

      {/* chrome row */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 999,
          background: `${color}1a`, border: `.5px solid ${color}55`,
          fontFamily: "'Sora',sans-serif", fontSize: 10, letterSpacing: '.22em',
          color: isRuin ? MUTED_2 : INK, textTransform: 'uppercase',
        }}>
          <span style={{ fontSize: 12, color }}>{DISTRICT_SIGIL[p.district]}</span>
          {DISTRICT_LABEL[p.district]}
        </span>
        <span style={{
          fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
          fontSize: 22, letterSpacing: '.08em',
          color: isLegendary ? GOLD : MUTED,
        }}>{RARITY_NUMERAL[p.rarity]}</span>
      </div>

      {/* name */}
      <h3 style={{
        position: 'relative', margin: '10px 0 4px', textAlign: 'center',
        fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 500,
        fontSize: 'clamp(22px, 4.4vw, 26px)', lineHeight: 1.1, color: INK,
      }}>{p.name}</h3>

      {/* depth wheel */}
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', margin: '8px 0 4px' }}>
        <DepthWheel depth={p.depth} emoji={p.emoji || '✨'} dir={p.trend_dir} color={color} animate={animate} />
      </div>
      <div style={{ textAlign: 'center', fontFamily: "'Sora',sans-serif", fontSize: 10, letterSpacing: '.22em', color: MUTED_2, marginBottom: 8 }}>
        {isRuin ? 'GONE TO RUIN' : `DEPTH ${p.depth}/5`}
      </div>

      {/* trend chart */}
      <div style={{ position: 'relative', margin: '2px 0 10px' }}>
        <TrendChart trend={p.trend} color={color} animate={animate} />
      </div>

      {/* signal bar */}
      <div style={{ position: 'relative', margin: '2px 0 10px' }}>
        <SignalBar sources={p.sources ?? {}} animate={animate} />
      </div>

      {/* readout row */}
      <div style={{
        position: 'relative', display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', padding: '12px 0 10px',
        borderTop: '.5px solid rgba(255,255,255,.08)',
      }}>
        <div>
          <div style={{
            fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 30,
            color, lineHeight: 1, letterSpacing: '-.02em',
          }}>
            <CountTick value={p.count} animate={animate} />
          </div>
          <div style={{
            marginTop: 4, fontFamily: "'Sora',sans-serif", fontSize: 10,
            color: MUTED_3, letterSpacing: '.18em', textTransform: 'uppercase',
          }}>all-time signals</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,.05)',
            border: `.5px solid ${trendColor(p.trend_dir)}55`,
            fontFamily: "'Sora',sans-serif", fontSize: 10, letterSpacing: '.14em',
            color: trendColor(p.trend_dir), textTransform: 'uppercase',
          }}>{trendArrow(p.trend_dir)} {p.trend_dir}</span>
          <div style={{
            marginTop: 6, fontFamily: "'Sora',sans-serif", fontSize: 9.5,
            color: MUTED_3, letterSpacing: '.14em',
          }}>last seen · {timeAgo(p.last_seen)}</div>
        </div>
      </div>

      {/* punch line */}
      <p style={{
        position: 'relative', margin: '8px 0 6px', textAlign: 'center',
        fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
        fontSize: 18, lineHeight: 1.3, color: INK,
      }}>
        &ldquo;{p.punch || p.insight || 'still forming.'}&rdquo;
      </p>

      {/* record stamp */}
      <div style={{
        position: 'relative', textAlign: 'center',
        fontFamily: "'Sora',sans-serif", fontSize: 10.5, fontWeight: 700,
        letterSpacing: '.22em', color: isLegendary ? GOLD : MUTED, textTransform: 'uppercase',
        marginTop: 4,
      }}>
        {p.count}× · {p.trend_dir}{p.record ? ` · ${p.record}` : ''}
      </div>

      {/* footer stamp */}
      <div style={{
        position: 'relative', marginTop: 10, display: 'flex',
        justifyContent: 'center', alignItems: 'center', gap: 8, opacity: .55,
      }}>
        <span style={{ width: 12, height: 9 }}>
          <svg viewBox="0 0 140 96" fill="none" style={{ width: '100%', height: '100%' }}>
            <rect x="16" y="6" width="56" height="84" rx="28" fill={color} opacity=".8" />
            <rect x="84" y="6" width="56" height="84" rx="28" fill={color} opacity=".8" />
          </svg>
        </span>
        <span style={{
          fontFamily: "'Sora',sans-serif", fontSize: 9, letterSpacing: '.32em',
          color: MUTED_2, textTransform: 'uppercase',
        }}>shutap · the mirror</span>
      </div>
    </article>
  )
}

/* ─────────────── deck-back reveal cover ─────────────── */
function DeckBack({ onDone }: { onDone: () => void }) {
  const [lifting, setLifting] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setLifting(true), 700)
    const t2 = setTimeout(onDone, 1650)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])
  return (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, borderRadius: 22, overflow: 'hidden',
      background: 'radial-gradient(120% 80% at 50% 0%, #2a0d1c, #160810 60%, #100810)',
      border: `.5px solid ${GOLD}55`,
      display: 'grid', placeItems: 'center', zIndex: 4,
      transition: 'transform 900ms cubic-bezier(.2,.7,.2,1), opacity 900ms ease',
      transform: lifting ? 'translateY(-10%) scale(1.06) rotate(-2deg)' : 'translateY(0) scale(1)',
      opacity: lifting ? 0 : 1,
      boxShadow: `0 0 60px ${GOLD}22`,
    }}>
      <div style={{ position: 'absolute', inset: 6, borderRadius: 18, border: `.5px solid ${GOLD}44` }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 34, margin: '0 auto', opacity: .9 }}>
          <svg viewBox="0 0 140 96" fill="none" style={{ width: '100%', height: '100%' }}>
            <rect x="16" y="6" width="56" height="84" rx="28" fill={GOLD} opacity=".85" />
            <rect x="84" y="6" width="56" height="84" rx="28" fill={GOLD} opacity=".85" />
            <ellipse cx="44" cy="62" rx="19" ry="24" fill="#100810" />
            <ellipse cx="112" cy="62" rx="19" ry="24" fill="#100810" />
          </svg>
        </div>
        <div style={{
          marginTop: 18, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
          fontSize: 19, color: GOLD, letterSpacing: '.04em',
        }}>a reading is forming…</div>
      </div>
    </div>
  )
}

/* ─────────────── mini card (the cast) ─────────────── */
function MiniCard({ p, onOpen }: { p: MirrorPatternView; onOpen: () => void }) {
  const color = p.state === 'ruin' ? RUIN_MOSS : DISTRICT_COLOR[p.district]
  const isLegendary = p.rarity === 'legendary' && p.state !== 'ruin'
  const isRuin = p.state === 'ruin'
  return (
    <button
      onClick={onOpen}
      style={{
        textAlign: 'left', cursor: 'pointer', padding: 16, borderRadius: 18,
        background: isRuin
          ? 'radial-gradient(125% 80% at 50% 0%, #2a2e22, #15140f 65%)'
          : `radial-gradient(125% 80% at 50% 0%, ${color}33, #170a14 62%)`,
        border: `1px solid ${isLegendary ? GOLD : `${color}55`}`,
        color: INK, position: 'relative',
        boxShadow: isLegendary ? `0 0 26px ${GOLD}33` : `0 14px 30px -10px rgba(0,0,0,.5)`,
        transition: 'transform .25s ease, box-shadow .25s ease',
        filter: isRuin ? 'saturate(.5) grayscale(.3)' : undefined,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: "'Sora',sans-serif", fontSize: 9.5, letterSpacing: '.22em',
          color: isRuin ? MUTED_2 : INK, textTransform: 'uppercase',
        }}>
          <span style={{ color }}>{DISTRICT_SIGIL[p.district]}</span>
          {DISTRICT_LABEL[p.district]}
        </span>
        <span style={{
          fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
          fontSize: 16, color: isLegendary ? GOLD : MUTED,
        }}>{RARITY_NUMERAL[p.rarity]}</span>
      </div>
      <div style={{
        marginTop: 10, fontSize: 30, lineHeight: 1, textAlign: 'center',
        filter: `drop-shadow(0 0 12px ${color}99)`,
      }}>{p.emoji || '✨'}</div>
      <div style={{
        marginTop: 6, textAlign: 'center',
        fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
        fontSize: 19, color: INK,
      }}>{p.name}</div>
      <p style={{
        marginTop: 8, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
        fontSize: 14, lineHeight: 1.35, color: MUTED,
        textAlign: 'center',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{p.punch || p.insight || '—'}</p>
      <div style={{
        marginTop: 10, display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderTop: '.5px solid rgba(255,255,255,.08)', paddingTop: 8,
      }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3, 4, 5].map((d) => (
            <span key={d} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: d <= p.depth ? color : 'rgba(255,255,255,.10)',
              boxShadow: d <= p.depth ? `0 0 6px ${color}cc` : undefined,
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color, fontVariantNumeric: 'tabular-nums' }}>{p.count}</span>
          <span style={{
            fontFamily: "'Sora',sans-serif", fontSize: 9, letterSpacing: '.14em',
            color: trendColor(p.trend_dir), textTransform: 'uppercase',
          }}>{trendArrow(p.trend_dir)}</span>
        </div>
      </div>
    </button>
  )
}

/* ─────────────── world band ─────────────── */
function WorldBand({
  patterns, onJump,
}: { patterns: MirrorPatternView[]; onJump: (d: District) => void }) {
  const grouped = useMemo(() => {
    const acc: Record<District, MirrorPatternView[]> = { self: [], career: [], love: [], family: [], social: [] }
    for (const p of patterns) acc[p.district].push(p)
    return acc
  }, [patterns])
  return (
    <section style={{
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginTop: 24,
    }}>
      {DISTRICTS.map((d) => {
        const list = grouped[d]
        const ruins = list.filter((p) => p.state === 'ruin').length
        const total = list.reduce((a, p) => a + p.count, 0)
        const color = DISTRICT_COLOR[d]
        return (
          <button
            key={d}
            onClick={() => onJump(d)}
            style={{
              cursor: 'pointer', textAlign: 'center',
              background: `radial-gradient(120% 80% at 50% 0%, ${color}1f, #150815 70%)`,
              border: `.5px solid ${color}33`, borderRadius: 14,
              padding: '12px 8px 10px', color: INK,
            }}
          >
            <div style={{
              height: 70, display: 'flex', gap: 3, alignItems: 'flex-end', justifyContent: 'center',
            }}>
              {list.length === 0 ? (
                <span style={{ fontSize: 11, color: MUTED_3, alignSelf: 'center', fontFamily: "'Sora',sans-serif", letterSpacing: '.16em' }}>—</span>
              ) : list.slice(0, 8).map((p, i) => (
                <div key={i} style={{
                  width: 6, height: 8 + (p.depth / 5) * 56,
                  borderRadius: 2,
                  background: p.state === 'ruin'
                    ? `linear-gradient(180deg, ${RUIN_MOSS}, #3a3a2e)`
                    : `linear-gradient(180deg, ${color}, ${color}55)`,
                  boxShadow: p.state === 'ruin' ? 'none' : `0 0 6px ${color}88`,
                  opacity: p.state === 'ruin' ? 0.5 : 1,
                }} />
              ))}
            </div>
            <div style={{
              marginTop: 6, fontFamily: "'Sora',sans-serif", fontSize: 10,
              letterSpacing: '.18em', color: MUTED,
            }}>
              <span style={{ color }}>{DISTRICT_SIGIL[d]}</span> {DISTRICT_LABEL[d].toUpperCase()}
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
              fontSize: 13, color: MUTED_2,
            }}>{total} signals · {ruins} ruin</div>
          </button>
        )
      })}
    </section>
  )
}

/* ─────────────── cross-read ─────────────── */
function CrossReadPanel({ patterns }: { patterns: MirrorPatternView[] }) {
  const cross = useServerFn(runMirrorCrossRead)
  const top = patterns.slice(0, 12)
  const key = top.map((p) => p.id).sort().join(',')
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['mirror-cross', key],
    enabled: patterns.length >= 2,
    staleTime: 1000 * 60 * 30,
    queryFn: () => cross({
      data: {
        patterns: top.map((p) => ({
          name: p.name, district: p.district, count: p.count, depth: p.depth, trend_dir: p.trend_dir,
        })),
      },
    }),
  })
  const totals = useMemo(() => {
    const acc: Record<District, number> = { self: 0, career: 0, love: 0, family: 0, social: 0 }
    for (const p of patterns) acc[p.district] += p.count
    return acc
  }, [patterns])
  const max = Math.max(1, ...Object.values(totals))
  // instant fallback derived from data
  const fallbackSees = useMemo(() => {
    const top2 = [...patterns].sort((a, b) => b.depth - a.depth).slice(0, 2)
    if (top2.length < 2) return 'the patterns are still rhyming.'
    return `${top2[0].name.toLowerCase()} and ${top2[1].name.toLowerCase()} keep showing up in the same week.`
  }, [patterns])
  return (
    <section style={{
      marginTop: 32, padding: 22, borderRadius: 20, color: INK,
      background: 'radial-gradient(120% 80% at 50% 0%, #1f0d1a, #100810 70%)',
      border: `.5px solid ${GOLD}55`,
      boxShadow: `0 0 40px ${GOLD}1a`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 10 }}>
            <svg viewBox="0 0 140 96" fill="none" style={{ width: '100%', height: '100%' }}>
              <rect x="16" y="6" width="56" height="84" rx="28" fill={GOLD} opacity=".9" />
              <rect x="84" y="6" width="56" height="84" rx="28" fill={GOLD} opacity=".9" />
              <ellipse cx="44" cy="62" rx="19" ry="24" fill="#100810" />
              <ellipse cx="112" cy="62" rx="19" ry="24" fill="#100810" />
            </svg>
          </span>
          <span style={{
            fontFamily: "'Sora',sans-serif", fontSize: 10.5, fontWeight: 700,
            letterSpacing: '.28em', color: GOLD,
          }}>WHAT YOUR MIRROR SEES</span>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} style={{
          background: 'transparent', border: 0, color: MUTED,
          fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13, cursor: 'pointer',
        }}>{isFetching ? 're-reading…' : 're-read ↻'}</button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginTop: 14,
      }}>
        {DISTRICTS.map((d) => {
          const v = totals[d]
          const h = 8 + (v / max) * 40
          const color = DISTRICT_COLOR[d]
          return (
            <div key={d} style={{ textAlign: 'center' }}>
              <div style={{ height: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div style={{
                  width: 14, height: h, borderRadius: 3,
                  background: v > 0 ? `linear-gradient(180deg, ${color}, ${color}55)` : 'rgba(255,255,255,.06)',
                  boxShadow: v > 0 ? `0 0 10px ${color}88` : 'none',
                }} />
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 9, color: MUTED_2, letterSpacing: '.16em', marginTop: 4 }}>
                <span style={{ color }}>{DISTRICT_SIGIL[d]}</span> {v}
              </div>
            </div>
          )
        })}
      </div>
      <p style={{
        margin: '18px 0 8px', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
        fontSize: 24, lineHeight: 1.3, color: INK,
      }}>{data?.sees || fallbackSees}</p>
      <p style={{
        margin: 0, fontFamily: "'Newsreader',serif", fontStyle: 'italic',
        fontSize: 16, lineHeight: 1.4, color: MUTED,
      }}>{data?.throughline || 'the throughline is forming as you spill more.'}</p>
      {data?.record && (
        <div style={{
          marginTop: 14, paddingTop: 10,
          borderTop: '.5px solid rgba(255,255,255,.10)',
          fontFamily: "'Sora',sans-serif", fontSize: 10, letterSpacing: '.24em',
          color: MUTED_3, textTransform: 'uppercase',
        }}>{data.record}</div>
      )}
    </section>
  )
}

/* ─────────────── overlay detail ─────────────── */
function DetailOverlay({
  p, onClose, onShare,
}: { p: MirrorPatternView; onClose: () => void; onShare: (p: MirrorPatternView) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const [tick, setTick] = useState(0)
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80,
      background: 'rgba(8,4,10,.78)', backdropFilter: 'blur(10px)',
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      padding: '24px 16px', boxSizing: 'border-box',
      animation: 'mirror-fade .2s ease',
    }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px, 100%, calc((100dvh - 140px) * 0.78))',
          minWidth: 240,
          margin: '0 auto',
          position: 'relative',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        key={tick}
      >
        <TarotCard p={p} animate />
        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: 16, marginTop: 14, paddingBottom: 24,
        }}>
          <button onClick={() => setTick((t) => t + 1)} style={{
            background: 'transparent', border: 0, color: MUTED,
            fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, cursor: 'pointer',
          }}>re-read this ↻</button>
          <button onClick={() => onShare(p)} style={{
            background: 'transparent', border: 0, color: GOLD,
            fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, cursor: 'pointer',
          }}>share card →</button>
          <button onClick={onClose} style={{
            background: 'transparent', border: 0, color: MUTED_2,
            fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, cursor: 'pointer',
          }}>close ✕</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── share ─────────────── */
// Share now flows through MirrorShareSheet (rendered at the page root) so
// the channel pills match the Scan share card exactly.

/* ─────────────── forming state ─────────────── */
function Forming({ onSpill, onPreview, hasDemo, previewing }: {
  onSpill: () => void
  onPreview: () => void
  hasDemo: boolean
  previewing: boolean
}) {
  return (
    <section style={{
      marginTop: 28, padding: 28, borderRadius: 22, color: INK,
      background: 'radial-gradient(125% 80% at 50% 0%, #260e1e, #100810 65%)',
      border: `.5px solid ${GOLD}33`,
    }}>
      <div style={{
        fontFamily: "'Sora',sans-serif", fontSize: 10.5, fontWeight: 700,
        letterSpacing: '.28em', color: GOLD, marginBottom: 10,
      }}>STILL FORMING</div>
      <p style={{
        margin: '0 0 16px', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
        fontSize: 26, lineHeight: 1.2,
      }}>the mirror begins the moment you spill or scan.<br />nothing here yet — and nothing fabricated.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onSpill} style={{
          background: '#e7548a', color: '#fff', border: 0, borderRadius: 999,
          padding: '11px 22px', fontFamily: "'Sora',sans-serif", fontWeight: 700,
          fontSize: 13, cursor: 'pointer',
        }}>spill or scan →</button>
        {hasDemo && (
          <button onClick={onPreview} style={{
            background: 'transparent', color: GOLD,
            border: `.5px solid ${GOLD}66`, borderRadius: 999,
            padding: '11px 22px', fontFamily: "'Sora',sans-serif", fontWeight: 700,
            fontSize: 13, cursor: 'pointer',
          }}>{previewing ? 'hide example mirror' : 'see what yours becomes ✦'}</button>
        )}
      </div>
    </section>
  )
}

/* ─────────────── page ─────────────── */
export function MirrorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fetchMine = useServerFn(listMirrorPatterns)
  const fetchDemo = useServerFn(listDemoPatterns)
  const { data: mine, isLoading } = useQuery({
    queryKey: ['mirror-patterns', 'me'],
    queryFn: () => fetchMine(),
  })
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])
  const isDemoAccount = !!userId && DEMO_PREVIEW_USER_IDS.has(userId)

  const { data: demo } = useQuery({
    queryKey: ['mirror-patterns', 'demo'],
    queryFn: () => fetchDemo(),
    enabled: isDemoAccount,
    staleTime: 1000 * 60 * 30,
  })

  const mineList = (mine ?? []) as unknown as MirrorPatternView[]
  const demoList = (demo ?? []) as unknown as MirrorPatternView[]
  const isForming = mineList.length < 2
  const [showDemo, setShowDemo] = useState(false)
  // Only the designated demo account sees the seeded cast automatically.
  // All other accounts see the real Forming state (empty cards + CTAs).
  const autoDemo = isDemoAccount && isForming && demoList.length > 0
  const list = showDemo || autoDemo ? demoList : mineList

  // keyframes + fonts injection (idempotent)
  useEffect(() => {
    if (document.getElementById('mirror-kf')) return
    const s = document.createElement('style')
    s.id = 'mirror-kf'
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&display=swap');
      @keyframes mirror-orbit { to { transform: rotate(360deg); } }
      @keyframes mirror-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      @keyframes mirror-aura { 0%,100% { opacity:.7 } 50% { opacity:1 } }
      @keyframes mirror-fade { from { opacity: 0 } to { opacity: 1 } }
      @keyframes mirror-pulse-dot { 0%,100% { transform: scale(1); opacity:.9 } 50% { transform: scale(1.4); opacity:.5 } }
      .mirror-shell { color-scheme: dark }
    `
    document.head.appendChild(s)
  }, [])

  // daily-first reveal
  const mostRecent = list[0] ?? null
  const [revealing, setRevealing] = useState(false)
  const [animateHero, setAnimateHero] = useState(false)
  const [heroTick, setHeroTick] = useState(0)
  useEffect(() => {
    if (!mostRecent) return
    const today = new Date().toISOString().slice(0, 10)
    const key = `mirror_seen_${mostRecent.id}`
    const seen = localStorage.getItem(key)
    const fullReveal = seen !== today
    setRevealing(fullReveal)
    setAnimateHero(true)
    if (fullReveal) {
      try { localStorage.setItem(key, today) } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostRecent?.id, heroTick])
  const replay = () => {
    setRevealing(true)
    setAnimateHero(false)
    requestAnimationFrame(() => { setAnimateHero(true); setHeroTick((t) => t + 1) })
  }

  // district jump
  const sectionRefs = useRef<Record<District, HTMLElement | null>>({
    self: null, career: null, love: null, family: null, social: null,
  })
  const jumpDistrict = (d: District) => {
    const el = sectionRefs.current[d]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  // detail overlay
  const [openCard, setOpenCard] = useState<MirrorPatternView | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  // share sheet
  const [shareTarget, setShareTarget] = useState<{ p: MirrorPatternView; source: 'hero' | 'overlay' } | null>(null)

  // group by district
  const grouped = useMemo(() => {
    const acc: Record<District, MirrorPatternView[]> = { self: [], career: [], love: [], family: [], social: [] }
    for (const p of list) acc[p.district].push(p)
    return acc
  }, [list])

  // location hash → optional district scroll
  useEffect(() => {
    const h = (location.hash || '').replace('#', '')
    if (DISTRICTS.includes(h as District)) {
      setTimeout(() => jumpDistrict(h as District), 200)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash])

  return (
    <div className="mirror-shell" style={{
      minHeight: '100vh',
      background: `radial-gradient(120% 80% at 50% -10%, #2a0d1c, #160810 55%, ${BG})`,
      color: INK,
    }}>
      <MirrorHeader />
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 22px 80px' }}>
        {/* hero zone */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13,
            color: MUTED, letterSpacing: '.02em',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#e7548a',
              boxShadow: '0 0 10px #e7548a', animation: 'mirror-pulse-dot 1.8s ease-in-out infinite',
            }} />
            your most recent reading
          </div>
          <h1 style={{
            margin: '8px auto 0', maxWidth: 760,
            fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 500,
            fontSize: 'clamp(28px, 4.4vw, 40px)', lineHeight: 1.15, color: INK,
          }}>the mirror remembers you better than you do.</h1>
        </div>

        {isLoading && (
          <p style={{
            textAlign: 'center', fontFamily: "'Newsreader',serif", fontStyle: 'italic',
            color: MUTED, marginTop: 28,
          }}>gathering your memory…</p>
        )}

        {!isLoading && isForming && !autoDemo && !showDemo && (
          <Forming
            onSpill={() => navigate('/')}
            onPreview={() => setShowDemo(true)}
            hasDemo={demoList.length > 0}
            previewing={false}
          />
        )}

        {/* hero card */}
        {mostRecent && (
          <div style={{ display: 'grid', placeItems: 'center', marginTop: 8 }}>
            <div style={{ width: 'min(460px, 100%, calc((100dvh - 260px) * 0.78))', minWidth: 240, position: 'relative' }} ref={heroRef}>
              <TarotCard p={mostRecent} animate={animateHero} />
              {revealing && <DeckBack onDone={() => setRevealing(false)} />}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
              <button onClick={replay} style={{
                background: 'transparent', border: 0, color: MUTED,
                fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, cursor: 'pointer',
              }}>↻ replay reveal</button>
              <button onClick={() => setShareTarget({ p: mostRecent, source: 'hero' })} style={{
                background: 'transparent', border: 0, color: GOLD,
                fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, cursor: 'pointer',
              }}>share this card →</button>
            </div>
          </div>
        )}

        {showDemo && (
          <div style={{
            marginTop: 18, padding: '8px 14px', borderRadius: 12, textAlign: 'center',
            background: `${GOLD}1a`, color: GOLD, border: `.5px solid ${GOLD}55`,
            fontFamily: "'Sora',sans-serif", fontSize: 10.5, letterSpacing: '.22em',
          }}>ILLUSTRATIVE — NOT YOUR DATA · <button onClick={() => setShowDemo(false)} style={{ background: 'transparent', border: 0, color: GOLD, cursor: 'pointer', textDecoration: 'underline' }}>hide</button></div>
        )}

        {/* your world */}
        {list.length > 0 && (
          <>
            <h2 style={{
              marginTop: 36, marginBottom: 0,
              fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontWeight: 500,
              fontSize: 22, color: INK, textAlign: 'center',
            }}>your world</h2>
            <WorldBand patterns={list} onJump={jumpDistrict} />
          </>
        )}

        {/* cross-read */}
        {list.length >= 2 && <CrossReadPanel patterns={list} />}

        {/* the cast */}
        {list.length > 0 && (
          <section style={{ marginTop: 40 }}>
            {DISTRICTS.map((d) => {
              const items = grouped[d]
              if (items.length === 0) return null
              const color = DISTRICT_COLOR[d]
              return (
                <section
                  key={d}
                  ref={(el) => { sectionRefs.current[d] = el }}
                  style={{ marginTop: 32, scrollMarginTop: 80 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 999,
                      background: `${color}1f`, border: `.5px solid ${color}55`,
                      fontFamily: "'Sora',sans-serif", fontSize: 10.5, fontWeight: 700,
                      letterSpacing: '.22em', color: INK, textTransform: 'uppercase',
                    }}>
                      <span style={{ color, fontSize: 13 }}>{DISTRICT_SIGIL[d]}</span>
                      {DISTRICT_LABEL[d]}
                    </span>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}55, transparent)` }} />
                    <span style={{
                      fontFamily: "'Newsreader',serif", fontStyle: 'italic',
                      fontSize: 13, color: MUTED_2,
                    }}>{items.length} here</span>
                  </div>
                  <div style={{
                    display: 'grid', gap: 14,
                    gridTemplateColumns: 'repeat(auto-fill, minmax(232px, 1fr))',
                  }}>
                    {items.map((p) => (
                      <MiniCard key={p.id} p={p} onOpen={() => setOpenCard(p)} />
                    ))}
                  </div>
                </section>
              )
            })}
          </section>
        )}

        {/* footer */}
        <footer style={{ marginTop: 56, textAlign: 'center', paddingTop: 28, borderTop: '.5px solid rgba(255,255,255,.08)' }}>
          <p style={{
            margin: 0, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic',
            fontSize: 15, color: MUTED, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto',
          }}>the mirror records, observes, and analyzes. it does not diagnose or advise.</p>
          <div style={{
            marginTop: 16, fontFamily: "'Sora',sans-serif", fontSize: 10,
            letterSpacing: '.32em', color: MUTED_3,
          }}>SHUTAP · THE MIRROR</div>
        </footer>
      </main>

      {openCard && (
        <div ref={overlayRef}>
          <DetailOverlay
            p={openCard}
            onClose={() => setOpenCard(null)}
            onShare={(p) => setShareTarget({ p, source: 'overlay' })}
          />
        </div>
      )}

      {shareTarget && (
        <MirrorShareSheet
          open
          onClose={() => setShareTarget(null)}
          pattern={shareTarget.p}
          defaultCaption={`"${shareTarget.p.punch || shareTarget.p.insight}" — ${shareTarget.p.name} · shutap mirror`}
          fileName={`mirror-${shareTarget.p.name.toLowerCase().replace(/\s+/g, '-')}.png`}
        />
      )}
    </div>
  )
}
