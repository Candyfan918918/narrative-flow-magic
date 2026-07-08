// Chapter 03 — "THE MIRROR · DEMO" (labeled). Cycles through 3 static demo
// patterns from mirrorCast.ts. Contains ZERO links — the whole card is inert
// (the lock banner CTA below the card is the only link out).
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@/compat/router'
import { useOnScreen, usePrefersReducedMotion } from '../hero/Mascot'
import { DEMO_DISTRICTS, DEMO_MIRROR_CAST, type DemoPattern } from '../mirrorCast'

const SORA = "'Sora',system-ui,sans-serif"
const NEWS = "'Newsreader',Georgia,serif"

const CYCLE_MS = 5200

export function Chapter03Mirror() {
  const ref = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(ref, 0.15)
  const reduce = usePrefersReducedMotion()
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (reduce || !onScreen) return
    const iv = window.setInterval(() => setIdx((i) => (i + 1) % DEMO_MIRROR_CAST.length), CYCLE_MS)
    return () => window.clearInterval(iv)
  }, [reduce, onScreen])

  const p = DEMO_MIRROR_CAST[idx]

  return (
    <section
      ref={ref}
      className="home-chapter"
      style={{ background: '#100c14', minHeight: '96vh', padding: 'clamp(90px,12vh,150px) 22px', display: 'flex', alignItems: 'center', color: '#f7e8f0' }}
    >
      <div className="home-grid-2" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 56, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', color: '#e9c06a', marginBottom: 18 }}>
            chapter 03 — the mirror ✦
          </div>
          <h2 style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(30px,3.8vw,54px)', lineHeight: 1.05, letterSpacing: '-.03em', margin: '0 0 20px', color: '#f7e8f0' }}>
            your patterns, <em style={{ fontFamily: NEWS, fontStyle: 'italic', color: '#f7b8d4', fontWeight: 400 }}>read as cards.</em>
          </h2>
          <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 19, lineHeight: 1.6, color: '#c4a0b2', maxWidth: '46ch', margin: '0 0 28px' }}>
            the mirror reads across your rooms and deals what keeps coming back — how deep it runs, which way it's moving, and how far you've already come.
          </p>
          <button
            type="button"
            onClick={() => navigate('/subscribe')}
            style={{
              background: 'linear-gradient(135deg,#e9c06a,#c69a3d)',
              color: '#1a0d16',
              border: 0,
              padding: '14px 22px',
              borderRadius: 999,
              fontFamily: SORA,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            unlock the full mirror ✦
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <MirrorDemoCard pattern={p} idx={idx} />
          <LockBanner onUnlock={() => navigate('/subscribe')} />
        </div>
      </div>
    </section>
  )
}

function MirrorDemoCard({ pattern, idx }: { pattern: DemoPattern; idx: number }) {
  const reduce = usePrefersReducedMotion()
  const [depthProgress, setDepthProgress] = useState(reduce ? 1 : 0)
  const [signalCount, setSignalCount] = useState(reduce ? pattern.signals : 0)
  const [trendProgress, setTrendProgress] = useState(reduce ? 1 : 0)

  useEffect(() => {
    if (reduce) return
    setDepthProgress(0); setSignalCount(0); setTrendProgress(0)
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = now - start
      const dp = Math.min(1, t / 1300)
      const sp = Math.min(1, t / 1200)
      const tp = Math.min(1, t / 1500)
      setDepthProgress(1 - Math.pow(1 - dp, 3))
      setSignalCount(Math.round(sp * pattern.signals))
      setTrendProgress(1 - Math.pow(1 - tp, 3))
      if (t < 1600) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [idx, pattern, reduce])

  const depthOfMax = pattern.depth / 5
  const size = 60
  const r = 24
  const c = 2 * Math.PI * r
  const dash = c * depthOfMax * depthProgress

  // Build sparkline path for weekly array
  const w = 260, h = 40
  const maxW = Math.max(...pattern.weekly)
  const points = pattern.weekly.map((v, i) => {
    const x = (i / (pattern.weekly.length - 1)) * w
    const y = h - (v / maxW) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const pathLen = 400 // approx; used for dash offset

  return (
    <div
      style={{
        width: 'min(380px,92vw)',
        background: 'radial-gradient(125% 80% at 50% 0%, rgba(127,119,221,.18), #1c0d16 58%, #140810)',
        border: '.5px solid rgba(233,192,106,.85)',
        borderRadius: 22,
        padding: 18,
        position: 'relative',
        boxShadow: '0 32px 60px -30px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06)',
      }}
    >
      {/* top sheen */}
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 32, background: 'linear-gradient(180deg, rgba(255,255,255,.06), transparent)', borderRadius: '22px 22px 0 0', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: '#e9c06a' }}>
          ✦ THE MIRROR — FULL READ
        </span>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {DEMO_MIRROR_CAST.map((_, i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx % DEMO_MIRROR_CAST.length ? '#e9c06a' : 'rgba(255,255,255,.15)' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <span style={{ fontSize: 34 }}>{pattern.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: 17, letterSpacing: '-.01em', color: '#f7e8f0' }}>{pattern.name}</div>
          <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: pattern.districtColor, marginTop: 2 }}>
            {pattern.districtLabel} {pattern.districtSymbol} · rarity {pattern.rarity}
          </div>
        </div>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={5} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={pattern.districtColor} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <text x="50%" y="55%" textAnchor="middle" fontFamily="Sora" fontWeight={700} fontSize={11} fill="#f7e8f0">
            {pattern.depth}/5
          </text>
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 12, color: '#f7e8f0' }}>{signalCount}</span>
        <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 12, color: '#c4a0b2' }}>signals</span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: SORA, fontWeight: 600, fontSize: 10,
          padding: '3px 9px', borderRadius: 999,
          background: 'rgba(255,255,255,.05)',
          border: '.5px solid rgba(255,255,255,.1)',
          color: pattern.trendColor, letterSpacing: '.08em', textTransform: 'uppercase',
        }}>
          {pattern.trendLabel}
        </span>
      </div>

      <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 13.5, color: '#f7e8f0', lineHeight: 1.5, marginBottom: 16 }}>
        {pattern.punch}
      </div>

      {/* trend line */}
      <div style={{ marginBottom: 14 }}>
        <svg width={w} height={h + 16} viewBox={`0 0 ${w} ${h + 16}`} style={{ display: 'block', maxWidth: '100%' }}>
          <polyline
            points={points}
            fill="none"
            stroke={pattern.districtColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLen}
            strokeDashoffset={pathLen * (1 - trendProgress)}
            style={{ transition: 'stroke-dashoffset .1s linear' }}
          />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: SORA, fontWeight: 700, fontSize: 8.5, letterSpacing: '.2em', color: 'rgba(255,255,255,.35)' }}>
          <span>7 WEEKS AGO</span>
          <span>THIS WEEK</span>
        </div>
      </div>

      {/* Where it shows up */}
      <div style={{ paddingTop: 12, borderTop: '.5px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 9, letterSpacing: '.22em', color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>
          WHERE IT SHOWS UP
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, fontFamily: SORA, fontWeight: 600, fontSize: 11, color: '#f7e8f0' }}>
          <SrcCell icon="🗯" color="#e7548a" n={pattern.sources.spill} />
          <SrcCell icon="📸" color="#7F77DD" n={pattern.sources.scan} />
          <SrcCell icon="💬" color="#c87c4a" n={pattern.sources.comments} />
          <SrcCell icon="♥" color="#c1216b" n={pattern.sources.likes} />
          <SrcCell icon="✦" color="#5B8A5E" n={pattern.sources.follows} />
          <SrcCell icon="👁" color="#9a7bd0" n={pattern.sources.browse} />
        </div>
      </div>

      {/* Mini world */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '.5px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 9, letterSpacing: '.22em', color: 'rgba(255,255,255,.5)', marginBottom: 10 }}>
          THE MIRROR WORLD · 5 DISTRICTS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {DEMO_DISTRICTS.map((d) => (
            <div key={d.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: d.color }}>
                {d.symbol} {d.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32 }}>
                {d.patterns.map((pp, i) => (
                  <div
                    key={i}
                    style={{
                      width: 5,
                      height: 6 + pp.depth * 5,
                      background: pp.ruined ? '#6f7a5e' : d.color,
                      borderRadius: 2,
                      opacity: pp.ruined ? .55 : .9,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14, fontFamily: SORA, fontWeight: 700, fontSize: 9, letterSpacing: '.24em', color: 'rgba(255,255,255,.28)', textAlign: 'center' }}>
        SHUTAP · THE MIRROR · DEMO
      </div>
    </div>
  )
}

function SrcCell({ icon, color, n }: { icon: string; color: string; n: number }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.03)', border: '.5px solid rgba(255,255,255,.06)', borderRadius: 8, padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ color, fontSize: 13, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 10.5, color: '#f7e8f0' }}>{n}</span>
    </div>
  )
}

function LockBanner({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div
      style={{
        width: 'min(380px,92vw)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'linear-gradient(140deg, rgba(233,192,106,.14), rgba(233,192,106,.04))',
        border: '.5px solid rgba(233,192,106,.4)',
        borderRadius: 16,
        padding: '10px 14px',
      }}
    >
      <span style={{ fontSize: 18 }}>🔒</span>
      <span style={{ flex: 1, fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13, color: '#e9c06a' }}>
        subscription required for full mirror access
      </span>
      <button
        type="button"
        onClick={onUnlock}
        style={{
          background: 'linear-gradient(135deg,#e9c06a,#c69a3d)',
          color: '#1a0d16',
          border: 0,
          borderRadius: 999,
          padding: '7px 14px',
          fontFamily: 'Sora,sans-serif',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        unlock →
      </button>
    </div>
  )
}
