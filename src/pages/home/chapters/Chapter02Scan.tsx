// Chapter 02 — "the scan · sample". 4-phase loop inside a 330px stage.
import { useEffect, useRef, useState } from 'react'
import { useOnScreen, usePrefersReducedMotion } from '../hero/Mascot'
import { useReactiveCard, useMagnetic } from '@/components/motion'
import { EyeMark } from '@/components/brand/EyeMark'

const SORA = "'Sora',system-ui,sans-serif"
const NEWS = "'Newsreader',Georgia,serif"

const PHASE_TIMES = [0, 2300, 4600, 6500, 12200] // start of P1..P4, then restart

export function Chapter02Scan({ onCtaScan }: { onCtaScan: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(ref, 0.15)
  const reduce = usePrefersReducedMotion()
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(reduce ? 3 : 0)
  const [dialProgress, setDialProgress] = useState(reduce ? 1 : 0)
  const [counter, setCounter] = useState(reduce ? 740 : 0)
  const card = useReactiveCard({ glow: 'rgba(231,84,138,.55)' })
  const magneticCta = useMagnetic<HTMLButtonElement>()

  useEffect(() => {
    if (reduce || !onScreen) return
    const timers: number[] = []
    const cycle = () => {
      setPhase(0); setDialProgress(0); setCounter(0)
      timers.push(window.setTimeout(() => setPhase(1), PHASE_TIMES[1]))
      timers.push(window.setTimeout(() => setPhase(2), PHASE_TIMES[2]))
      timers.push(window.setTimeout(() => {
        setPhase(3)
        // sweep dial 0->1 over 1.6s (kick a rAF)
        const start = performance.now()
        const step = (now: number) => {
          const p = Math.min(1, (now - start) / 1600)
          const eased = 1 - Math.pow(1 - p, 3)
          setDialProgress(eased)
          setCounter(Math.round(eased * 740))
          if (p < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }, PHASE_TIMES[3]))
    }
    cycle()
    const iv = window.setInterval(cycle, PHASE_TIMES[4])
    timers.push(iv)
    return () => {
      timers.forEach((h) => { window.clearTimeout(h); window.clearInterval(h) })
    }
  }, [onScreen, reduce])

  return (
    <section
      ref={ref}
      className="home-chapter"
      style={{
        background: 'linear-gradient(165deg,#241d47 0%,#151030 60%,#100c14)',
        minHeight: '96vh',
        padding: 'clamp(90px,12vh,150px) 22px',
        display: 'flex',
        alignItems: 'center',
        color: '#f7e8f0',
      }}
    >
      <span aria-hidden className="home-watermark" style={{ left: '3%', bottom: '6%', color: 'rgba(127,119,221,.08)' }}>scan</span>
      <div className="home-grid-2" style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 56, alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', color: '#aaa3e8', marginBottom: 18 }}>
            chapter 02 — scan it
          </div>
          <h2 style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(30px,3.8vw,54px)', lineHeight: 1.05, letterSpacing: '-.03em', margin: '0 0 20px', color: '#fff' }}>
            how heavy is it, <em style={{ fontFamily: NEWS, fontStyle: 'italic', color: '#aaa3e8', fontWeight: 400 }}>really?</em>
          </h2>
          <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 19, lineHeight: 1.6, color: '#d5c9de', maxWidth: '46ch', margin: '0 0 28px' }}>
            a 60-second read. the companion asks, you answer, and you get a private intensity score — before you decide whether the world gets to sit in.
          </p>
          <button
            type="button"
            onClick={onCtaScan}
            style={{
              background: '#fff',
              color: '#241d47',
              border: 0,
              padding: '14px 22px',
              borderRadius: 999,
              fontFamily: SORA,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            scan it →
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            ref={card.ref}
            style={{
              width: 'min(330px,88vw)',
              background: 'linear-gradient(170deg,#241226,#160b16)',
              border: '.5px solid rgba(231,84,138,.35)',
              borderRadius: 24,
              padding: 18,
              boxShadow: '0 32px 60px -30px rgba(60,10,30,.6)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#aaa3e8', padding: '4px 10px', border: '.5px solid rgba(170,163,232,.3)', borderRadius: 999 }}>
                relationships
              </span>
              <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>
                the scan · sample
              </span>
            </div>

            <div style={{ minHeight: 330, position: 'relative' }}>
              {(phase === 0 || phase === 1) && (
                <ScanQuestion
                  n={phase === 0 ? 2 : 3}
                  question={phase === 0 ? 'when it flares up, where do you feel it first?' : 'how often does it visit you?'}
                  options={
                    phase === 0
                      ? ['my chest goes tight', 'a knot in my stomach', 'my head starts racing']
                      : ['most days', 'a few times a week', 'now and then']
                  }
                  highlight={0}
                />
              )}
              {phase === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 18 }}>
                  <EyeMark size={64} />
                  <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 15, color: '#d5c9de' }}>reading the weight of it…</div>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <span className="home-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#aaa3e8', animationDelay: '0s' }} />
                    <span className="home-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#aaa3e8', animationDelay: '.2s' }} />
                    <span className="home-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#aaa3e8', animationDelay: '.4s' }} />
                  </div>
                </div>
              )}
              {phase === 3 && <ScanDial value={counter} progress={dialProgress} />}
            </div>

            <div style={{ marginTop: 12, fontFamily: SORA, fontWeight: 700, fontSize: 9, letterSpacing: '.24em', color: 'rgba(255,255,255,.35)', textAlign: 'center' }}>
              SHUTAP · THE SCAN
            </div>
            {card.decor}
          </div>
        </div>
      </div>
    </section>
  )
}

function ScanQuestion({ n, question, options, highlight }: { n: number; question: string; options: string[]; highlight: number }) {
  const reduce = usePrefersReducedMotion()
  const [hi, setHi] = useState<number>(reduce ? highlight : -1)
  useEffect(() => {
    if (reduce) return
    const t = window.setTimeout(() => setHi(highlight), 1300)
    return () => window.clearTimeout(t)
  }, [reduce, highlight, n])
  return (
    <div>
      <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#aaa3e8', marginBottom: 10 }}>
        question {n} of 6
      </div>
      <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 18, lineHeight: 1.35, color: '#fff', marginBottom: 18 }}>
        {question}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((o, i) => {
          const active = i === hi
          return (
            <div
              key={i}
              style={{
                fontFamily: SORA,
                fontWeight: 500,
                fontSize: 13,
                padding: '11px 14px',
                border: '.5px solid ' + (active ? '#aaa3e8' : 'rgba(255,255,255,.1)'),
                background: active ? 'rgba(127,119,221,.25)' : 'rgba(255,255,255,.02)',
                borderRadius: 12,
                color: active ? '#fff' : 'rgba(255,255,255,.75)',
                transform: active ? 'scale(1.03)' : 'scale(1)',
                transition: 'all .35s cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              {o}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScanDial({ value, progress }: { value: number; progress: number }) {
  const size = 180
  const r = 78
  const c = 2 * Math.PI * r
  const dash = c * progress
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minHeight: 300, justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e7548a"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: 'drop-shadow(0 0 8px rgba(231,84,138,.6))', transition: 'stroke-dasharray .1s linear' }}
        />
        <text x="50%" y="48%" textAnchor="middle" fontFamily="Sora" fontWeight={800} fontSize={40} fill="#fff">
          {value}
        </text>
        <text x="50%" y="62%" textAnchor="middle" fontFamily="Sora" fontSize={10} letterSpacing={2} fill="rgba(255,255,255,.55)">
          OF 999
        </text>
      </svg>
      <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-.01em' }}>Carrying It Loud</div>
      <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 12.5, color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 260, lineHeight: 1.4 }}>
        the part that hurts is how unseen it makes you feel — and you keep showing up anyway.
      </div>
      <div style={{ width: '100%', maxWidth: 260, height: 4, borderRadius: 2, background: 'linear-gradient(90deg,#5DCAA5,#aaa3e8,#e7548a,#e24b4a)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -3, left: `${74 * progress}%`, width: 2, height: 10, background: '#fff', borderRadius: 2 }} />
      </div>
    </div>
  )
}
