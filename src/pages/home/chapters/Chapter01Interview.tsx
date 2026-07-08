// Chapter 01 — labeled sample: "the interview · sample". A scripted chat
// timeline that loops while on screen and pauses off-screen. Zero real user
// data. Timings match the spec.
import { useEffect, useRef, useState } from 'react'
import { useOnScreen, usePrefersReducedMotion } from '../hero/Mascot'
import { useReactiveCard, useMagnetic } from '@/components/motion'
import { EyeMark } from '@/components/EyeMark'

const SORA = "'Sora',system-ui,sans-serif"
const NEWS = "'Newsreader',Georgia,serif"

type Step =
  | { kind: 'companion'; text: string; at: number }
  | { kind: 'user'; text: string; at: number }
  | { kind: 'chip'; text: string; at: number }

function buildTimeline(): Step[] {
  // durations mirror the spec: companion +1250ms, user (typed) +(600 + 26·chars + 650)
  const steps: Step[] = []
  let t = 700
  const push = (s: Step) => {
    steps.push(s)
  }
  const companion = (text: string) => {
    push({ kind: 'companion', text, at: t })
    t += 1250
  }
  const user = (text: string) => {
    push({ kind: 'user', text, at: t })
    t += 600 + 26 * text.length + 650
  }
  companion("i'm listening. what happened?")
  user("my sister told me she's been scared of me since we were kids. i had no idea.")
  companion('that\u2019s heavy. how long has it been sitting on you?')
  user("since tuesday. i can't say this to anyone who knows us.")
  companion("you don't have to. i can open a room — pseudonymous, full of people who've lived this exact thing.")
  push({ kind: 'chip', text: 'room opened · 31 sitting in', at: t })
  return steps
}

export function Chapter01Interview({ onCtaSpill }: { onCtaSpill: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(ref, 0.15)
  const reduce = usePrefersReducedMotion()
  const [timeline] = useState(buildTimeline)
  const [shown, setShown] = useState<number>(reduce ? timeline.length : 0)
  const card = useReactiveCard({ glow: 'rgba(231,84,138,.55)' })
  const magneticCta = useMagnetic<HTMLButtonElement>()


  useEffect(() => {
    if (reduce) return
    if (!onScreen) return
    setShown(0)
    const timers: number[] = []
    // Reveal each step at its scheduled time; loop after final + 3400ms hold.
    for (let i = 0; i < timeline.length; i++) {
      const s = timeline[i]
      timers.push(window.setTimeout(() => setShown(i + 1), s.at))
    }
    const lastAt = timeline[timeline.length - 1].at
    const loop = window.setTimeout(() => setShown(0), lastAt + 3400)
    timers.push(loop)
    // schedule next loop start after hold + reset
    const nextStart = window.setTimeout(() => {
      // by resetting shown to 0 and re-triggering effect... easier: rely on onScreen retriggering.
      // For continuous looping while on screen we just reset shown; the effect below will re-run because shown changed but effect deps only include onScreen. Use interval instead.
    }, lastAt + 3400 + 50)
    timers.push(nextStart)
    // Continuous loop: interval that restarts sequence
    const iv = window.setInterval(() => {
      setShown(0)
      for (let i = 0; i < timeline.length; i++) {
        const s = timeline[i]
        timers.push(window.setTimeout(() => setShown(i + 1), s.at))
      }
    }, lastAt + 3400)
    timers.push(iv)
    return () => {
      timers.forEach((h) => {
        window.clearTimeout(h)
        window.clearInterval(h)
      })
    }
  }, [onScreen, reduce, timeline])

  return (
    <section
      ref={ref}
      className="home-chapter"
      style={{ background: '#fdf0f5', minHeight: '96vh', padding: 'clamp(90px,12vh,150px) 22px', display: 'flex', alignItems: 'center' }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
          gap: 56,
          alignItems: 'center',
        }}
        className="home-grid-2"
      >
        <div>
          <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', color: '#e7548a', marginBottom: 18 }}>
            chapter 01 — spill it
          </div>
          <h2 style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(30px,3.8vw,54px)', lineHeight: 1.05, letterSpacing: '-.03em', margin: '0 0 20px', color: '#0b080f' }}>
            say the thing you can't say <em style={{ fontFamily: NEWS, fontStyle: 'italic', color: '#c1216b', fontWeight: 400 }}>anywhere else.</em>
          </h2>
          <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 19, lineHeight: 1.6, color: '#4a3040', maxWidth: '46ch', margin: '0 0 28px' }}>
            tell your story — it opens a room the world can sit in. people who've lived your exact thing show up, relate, and tell you what actually happened next.
          </p>
          <button
            type="button"
            onClick={onCtaSpill}
            style={{
              background: '#0b080f',
              color: '#fff',
              border: 0,
              padding: '14px 22px',
              borderRadius: 999,
              fontFamily: SORA,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              letterSpacing: '-.005em',
            }}
          >
            open a room →
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            ref={card.ref}
            style={{
              width: 'min(380px, 100%)',
              background: 'linear-gradient(160deg, #2e0d1a, #1a0a12)',
              borderRadius: 24,
              padding: 20,
              color: '#f7e8f0',
              boxShadow: '0 32px 60px -30px rgba(60,10,30,.6)',
              border: '.5px solid rgba(255,255,255,.06)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 18, height: 12, borderRadius: 6, background: 'linear-gradient(155deg,#ffd0e8,#c0206a)' }} />
                <span style={{ fontFamily: SORA, fontWeight: 600, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: '#f7b8d4' }}>
                  spilling it
                </span>
              </div>
              <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>
                the interview · sample
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 340 }}>
              {timeline.slice(0, shown).map((s, i) => {
                if (s.kind === 'chip') {
                  return (
                    <div key={i} className="home-bubble-in" style={{ alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(93,202,165,.12)', color: '#5DCAA5', border: '.5px solid rgba(93,202,165,.4)', borderRadius: 999, padding: '8px 14px', fontFamily: SORA, fontWeight: 600, fontSize: 12 }}>
                      <span className="home-livedot green" />
                      {s.text}
                    </div>
                  )
                }
                if (s.kind === 'companion') {
                  return (
                    <div key={i} className="home-bubble-in" style={{ alignSelf: 'flex-start', maxWidth: '82%', background: 'rgba(255,255,255,.06)', border: '.5px solid rgba(255,255,255,.08)', borderRadius: 16, padding: '10px 14px', fontFamily: NEWS, fontStyle: 'italic', fontSize: 14, color: '#f7e8f0', lineHeight: 1.45 }}>
                      {s.text}
                    </div>
                  )
                }
                return (
                  <div key={i} className="home-bubble-in" style={{ alignSelf: 'flex-end', maxWidth: '82%', background: '#e7548a', color: '#fff', borderRadius: 16, padding: '10px 14px', fontFamily: NEWS, fontStyle: 'italic', fontSize: 14, lineHeight: 1.45 }}>
                    {s.text}
                  </div>
                )
              })}
            </div>
            {card.decor}
          </div>
        </div>
      </div>
    </section>
  )
}
