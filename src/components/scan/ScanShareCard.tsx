/* Scan share card (§17). Animated radial ring driven by the real score,
 * spectrum bar with derived marker, looping aura. Honors prefers-reduced-motion. */
import { useEffect, useState } from 'react'

const BANDS = [
  { max: 199, word: 'settling',      color: '#7FB3D5', key: 'quiet'   },
  { max: 399, word: 'sitting with it',color: '#A18CD1',key: 'real'    },
  { max: 599, word: 'weighing',       color: '#7F77DD',key: 'hot'     },
  { max: 799, word: 'heavy & loud',   color: '#E07A8B',key: 'heavy'   },
  { max: 999, word: 'consuming',      color: '#C1216B',key: 'serious' },
] as const

export function bandFor(score: number) {
  return BANDS.find(b => score <= b.max) ?? BANDS[BANDS.length - 1]
}

export function ScanShareCard({ score, signature, read, pillar, alias }: { score: number; signature: string; read: string; pillar?: string; alias?: string }) {
  const band = bandFor(score)
  const r = 88
  const c = 2 * Math.PI * r
  const filled = (score / 999) * c

  const [shown, setShown] = useState(0)
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setShown(score); return }
    const start = performance.now()
    const dur = 1100
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      setShown(Math.round(score * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [score])

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `radial-gradient(circle at 30% 20%, ${band.color}44, transparent 60%), linear-gradient(160deg, #1a0e26, #160810)`,
      borderRadius: 20, padding: '28px 22px', color: '#fff', fontFamily: 'Sora,sans-serif',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: `conic-gradient(from 0deg, ${band.color}11, transparent 30%, ${band.color}22, transparent 70%)`, animation: 'shutapSpin 18s linear infinite', pointerEvents: 'none' }} />
      <style>{`@keyframes shutapSpin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 11, letterSpacing: '.2em', opacity: .8 }}>
        <span>SCAN ✦ shutap</span>
        {pillar && <span style={{ background: `${band.color}33`, color: '#fff', padding: '4px 10px', borderRadius: 999, fontSize: 10 }}>{pillar}</span>}
      </div>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '18px 0 14px' }}>
        <svg width={220} height={220} viewBox="0 0 220 220">
          <circle cx={110} cy={110} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={10} />
          <circle cx={110} cy={110} r={r} fill="none" stroke={band.color} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={`${filled} ${c}`} transform="rotate(-90 110 110)" style={{ transition: 'stroke-dasharray 1.1s ease-out' }} />
          <text x={110} y={108} textAnchor="middle" fontFamily="Sora,sans-serif" fontWeight={800} fontSize={50} fill={band.color}>{shown}</text>
          <text x={110} y={134} textAnchor="middle" fontFamily="Sora,sans-serif" fontSize={11} letterSpacing="3" fill="rgba(255,255,255,.7)">SCAN</text>
        </svg>
      </div>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 22, color: band.color, marginBottom: 4 }}>{signature || band.word}</div>
        <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: 'rgba(255,255,255,.78)', lineHeight: 1.45, padding: '0 6px' }}>{read}</div>
      </div>
      {/* spectrum bar */}
      <div style={{ position: 'relative', marginTop: 22 }}>
        <div style={{ height: 6, borderRadius: 4, background: 'linear-gradient(to right, #7FB3D5, #A18CD1, #7F77DD, #E07A8B, #C1216B)' }} />
        <div style={{ position: 'absolute', top: -5, left: `${(score / 999) * 100}%`, width: 14, height: 14, borderRadius: '50%', background: '#fff', border: `2px solid ${band.color}`, transform: 'translateX(-50%)', boxShadow: `0 0 12px ${band.color}aa` }} />
      </div>
      <div style={{ position: 'relative', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, opacity: .7 }}>
        <span>{alias ? `@${alias} · ` : ''}what's your number?</span>
        <span>shutap.com</span>
      </div>
    </div>
  )
}
