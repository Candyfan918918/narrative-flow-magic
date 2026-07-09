/* Section: Chapter02Scan — self-playing DEMO of the real scan flow +
 * result card. Presentation only; immersiveMount drives phase cycling,
 * the data-scannum count-up, and the data-mark spectrum marker slide. */
const SORA = "'Sora',sans-serif"
const NEWS = "'Newsreader',serif"

const optionRow = {
  display: 'block',
  background: 'rgba(127,119,221,.06)',
  border: '1px solid rgba(127,119,221,.22)',
  borderRadius: '16px',
  padding: '15px 18px',
  fontFamily: SORA,
  fontWeight: 600,
  fontSize: '16px',
  color: '#ece6f5',
} as const

const reactionStyle = {
  fontFamily: NEWS,
  fontStyle: 'italic',
  fontSize: '14px',
  color: '#b3a0d0',
  marginBottom: '2px',
} as const

const questionStyle = {
  fontFamily: SORA,
  fontWeight: 800,
  fontSize: 'clamp(22px,4.5vw,28px)',
  lineHeight: 1.18,
  letterSpacing: '-.03em',
  color: '#f7e8f0',
} as const

const eyebrowStyle = {
  fontFamily: SORA,
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '.22em',
  textTransform: 'uppercase' as const,
  color: '#8d86c9',
}

export function Chapter02Scan() {
  return (
    <section data-screen-label="02 Scan" data-theme="dark" className="chsec" style={{ position: 'relative', minHeight: '100vh', scrollSnapAlign: 'start', background: 'linear-gradient(165deg,#241d47,#151030 60%,#100c14)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div className="chgrid rev">
        <div data-rv="pop" data-democard="" style={{ display: 'flex', justifyContent: 'center' }}>
          <div data-reactive="" data-glow="rgba(231,84,138,.75)" style={{ width: 'min(420px,92vw)', background: 'linear-gradient(170deg,#2a1430,#170918 70%)', border: '1px solid rgba(231,84,138,.45)', borderRadius: '28px', padding: '28px 26px 24px', boxShadow: '0 50px 120px -40px rgba(231,84,138,.55), 0 20px 60px -20px rgba(0,0,0,.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(231,84,138,.16)', color: '#f7b8d4', border: '.5px solid rgba(231,84,138,.3)', borderRadius: '999px', padding: '4px 12px', fontFamily: SORA, fontWeight: 600, fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                relationships
              </span>
              <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: '12.5px', color: '#9e7a8c' }}>
                the scan · sample
              </span>
            </div>

            <div style={{ position: 'relative', minHeight: '440px' }}>
              {/* phase 0 — react + big question */}
              <div data-scph="" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', opacity: 0, transition: 'opacity .45s', pointerEvents: 'none' }}>
                <div style={eyebrowStyle}>question 2 of 6</div>
                <div style={reactionStyle}>okay — and be honest with me:</div>
                <div style={questionStyle}>when it flares up, where do you feel it first?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <span data-scpick="" style={{ ...optionRow, transition: 'background .35s,border-color .35s,transform .35s' }}>my chest goes tight</span>
                  <span style={optionRow}>my head starts spinning</span>
                  <span style={optionRow}>i go completely numb</span>
                </div>
              </div>

              {/* phase 1 */}
              <div data-scph="" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '14px', opacity: 0, transition: 'opacity .45s', pointerEvents: 'none' }}>
                <div style={eyebrowStyle}>question 3 of 6</div>
                <div style={reactionStyle}>mm, that tracks.</div>
                <div style={questionStyle}>how often does it visit you?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  <span style={optionRow}>once in a while</span>
                  <span data-scpick="" style={{ ...optionRow, transition: 'background .35s,border-color .35s,transform .35s' }}>most days</span>
                  <span style={optionRow}>it never really leaves</span>
                </div>
              </div>

              {/* phase 2 — thinking */}
              <div data-scph="" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', opacity: 0, transition: 'opacity .45s', pointerEvents: 'none' }}>
                <svg viewBox="0 0 56 56" fill="none" style={{ width: '46px', height: '46px' }}>
                  <rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)" />
                  <rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)" />
                  <ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG2)" />
                  <ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG2)" />
                </svg>
                <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: '16.5px', color: '#c6c0ef' }}>
                  reading the weight of it…
                </div>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7F77DD', animation: 'breathe 1.2s ease-in-out infinite', display: 'block' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7F77DD', animation: 'breathe 1.2s ease-in-out .2s infinite', display: 'block' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7F77DD', animation: 'breathe 1.2s ease-in-out .4s infinite', display: 'block' }} />
                </div>
              </div>

              {/* phase 3 — result card */}
              <div data-scph="" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', opacity: 0, transition: 'opacity .45s', pointerEvents: 'none' }}>
                {/* big score */}
                <div style={{ textAlign: 'center' }}>
                  <div data-scannum="" style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(72px,17vw,92px)', lineHeight: 1, letterSpacing: '-.04em', color: '#e7548a', fontVariantNumeric: 'tabular-nums' }}>
                    0
                  </div>
                  <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: '12px', letterSpacing: '.18em', textTransform: 'uppercase', color: '#e7548a', marginTop: '6px' }}>
                    intensity
                  </div>
                </div>

                {/* factor chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                  {['still looping', 'not said out loud'].map((c) => (
                    <span key={c} style={{ fontFamily: SORA, fontWeight: 600, fontSize: '10.5px', color: '#b9a9e6', background: 'rgba(127,119,221,.14)', borderRadius: '999px', padding: '4px 11px' }}>
                      {c}
                    </span>
                  ))}
                </div>

                {/* signature/read card */}
                <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
                  <svg viewBox="0 0 56 56" fill="none" style={{ width: '28px', height: '28px' }}>
                    <rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)" />
                    <rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG2)" />
                    <ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG2)" />
                    <ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG2)" />
                  </svg>
                  <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: '20px', color: '#f7e8f0' }}>
                    Carrying It Loud
                  </div>
                  <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: '15.5px', lineHeight: 1.55, color: '#c4a0b2' }}>
                    the part that hurts is how unseen it makes you feel — and you keep showing up anyway.
                  </div>
                </div>

                {/* band spectrum bar */}
                <div style={{ height: '5px', borderRadius: '3px', background: 'linear-gradient(90deg,#9e8f9c,#7F77DD,#c87c4a,#e7548a,#c1216b)', position: 'relative' }}>
                  <span data-mark="" style={{ position: 'absolute', left: '0', top: '50%', width: '13px', height: '13px', borderRadius: '50%', background: '#fff', border: '3px solid #e7548a', transform: 'translate(-50%,-50%)' }} />
                </div>

                {/* destinations hint */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
                  <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', borderRadius: '12px', padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: '10px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c' }}>keep private</span>
                  </div>
                  <div style={{ background: 'rgba(231,84,138,.10)', border: '1px solid rgba(231,84,138,.35)', borderRadius: '12px', padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: '10px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#f7b8d4' }}>post to a room →</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: .6, marginTop: '14px' }}>
              <span style={{ fontFamily: SORA, fontWeight: 800, fontSize: '8.5px', letterSpacing: '.28em', color: '#c4a0b2' }}>
                SHUTAP · THE SCAN
              </span>
            </div>
          </div>
        </div>

        <div data-rv="swipe-r">
          <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: '12px', letterSpacing: '.24em', textTransform: 'uppercase', color: '#aaa3e8', marginBottom: '22px' }}>
            chapter 01 — scan it
          </div>
          <h2 data-words="" style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(38px,5vw,68px)', lineHeight: 1.05, letterSpacing: '-.045em', margin: '0 0 24px', color: '#fff' }}>
            how heavy is it, <em style={{ fontFamily: NEWS, fontStyle: 'italic', fontWeight: 400, color: '#aaa3e8' }}>really?</em>
          </h2>
          <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 'clamp(16px,1.4vw,20px)', lineHeight: 1.6, color: '#c6c0ef', maxWidth: '44ch', margin: '0 0 32px' }}>
            a 60-second read. the companion asks, you answer, and you get a private intensity score — before you decide whether the world gets to sit in.
          </p>
          <a href="#scan" data-cta="scan" data-hover="" data-mag="" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontFamily: SORA, fontWeight: 700, fontSize: '15px', color: '#100c14', background: '#fff', borderRadius: '999px', padding: '16px 30px', transition: 'background .3s' }}>
            scan it →
          </a>
        </div>
      </div>
    </section>
  )
}
