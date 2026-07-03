/* Native React /welcome — no iframe. Implements the four-step ceremony:
 * auth sheet → age gate (18+) → alias mint / re-roll → welcome enter.
 * Wires real auth via lovable.auth (Google/Apple) and supabase.auth (magic
 * link). Persists alias to public.aliases and stamps legal acceptance. */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { lovable } from '@/integrations/lovable'
import { recordLegalAcceptance } from '@/lib/legal.functions'
import { upsertMyAlias, randomAliasParts, getMyAlias } from '@/lib/alias.functions'
import { useNoIndex } from '@/components/NoIndex'
import { setAlias } from '@/lib/auth'

type Step = 'auth' | 'age' | 'alias' | 'welcome'

const CREATURES = [
  { n: 'Owl', e: '🦉' }, { n: 'Fox', e: '🦊' }, { n: 'Bear', e: '🐻' }, { n: 'Lion', e: '🦁' },
  { n: 'Butterfly', e: '🦋' }, { n: 'Hedgehog', e: '🦔' }, { n: 'Swan', e: '🦢' }, { n: 'Wolf', e: '🐺' },
  { n: 'Hawk', e: '🦅' }, { n: 'Crane', e: '🕊' }, { n: 'Fawn', e: '🦌' }, { n: 'Hare', e: '🐇' },
  { n: 'Dove', e: '🕊' }, { n: 'Otter', e: '🦦' }, { n: 'Robin', e: '🐦' }, { n: 'Heron', e: '🪿' },
]
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

import { EyeMark as BrandEyeMark } from '@/components/brand/EyeMark'

function EyeMark({ size = 52 }: { size?: number }) {
  return (
    <span style={{ display: 'block', width: size, margin: '0 auto' }}>
      <BrandEyeMark size={size} />
    </span>
  )
}

const BG = '#1a0a12'
const TEXT = '#f7e8f0'
const SOFT = '#c4a0b2'
const MUTED = '#9e7a8c'
const ACCENT = '#e7548a'

const oauthBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  width: '100%', padding: '15px 20px', borderRadius: 14,
  border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)',
  cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 15,
  color: TEXT, transition: '.18s',
}
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '15px 20px', background: ACCENT, border: 'none',
  borderRadius: 14, color: '#fff', fontFamily: "'Sora',sans-serif",
  fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
const ghostBtn: React.CSSProperties = {
  width: '100%', padding: '15px 20px', background: 'rgba(231,84,138,.12)',
  border: '1.5px solid rgba(231,84,138,.35)', borderRadius: 14, color: '#f7b8d4',
  fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer',
}
const wheelSelect: React.CSSProperties = {
  appearance: 'none',
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 12,
  color: TEXT,
  fontFamily: "'Newsreader',serif",
  fontStyle: 'italic',
  fontSize: 16,
  padding: '12px 14px',
  minWidth: 80,
  textAlign: 'center',
  textAlignLast: 'center',
  cursor: 'pointer',
}

export function WelcomeNativePage() {
  useNoIndex()
  // Persist a hard rejection for the session — an under-18 result must not
  // be re-attempted by simply re-picking a year (RULE 4).
  const initialStep: Step = (() => {
    try {
      if (sessionStorage.getItem('shutap_age_rejected') === '1') return 'age'
    } catch { /* noop */ }
    return 'auth'
  })()
  const [step, setStep] = useState<Step>(initialStep)
  const [email, setEmail] = useState('')
  const [emailPhase, setEmailPhase] = useState<'input' | 'code'>('input')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ kind: 'err' | 'ok'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [ageBlocked, setAgeBlocked] = useState<boolean>(() => {
    try { return sessionStorage.getItem('shutap_age_rejected') === '1' } catch { return false }
  })

  const maxYear = new Date().getFullYear() - 18
  const [birth, setBirth] = useState({ day: 1, month: 1, year: maxYear - 12 })

  const [alias, setAliasState] = useState<{ emotion: string; nation: string; creature: string; emoji: string; display_name: string }>(() => ({ ...randomAliasParts() }))
  const emoji = useMemo(() => CREATURES.find((c) => c.n === alias.creature)?.e ?? alias.emoji, [alias])

  // On mount: only skip past the auth step when a REAL (non-anonymous) user
  // is signed in. Anonymous pseudonymous sessions must still see the
  // Google/Apple/email sheet so they can upgrade without losing their id.
  useEffect(() => {
    let cancelled = false
    const isAnon = (u: unknown) => Boolean((u as { is_anonymous?: boolean } | undefined)?.is_anonymous)
    const advanceForRealUser = async () => {
      try { await recordLegalAcceptance({ data: {} }) } catch { /* noop */ }
      try {
        const existing = await getMyAlias()
        if (cancelled) return
        if (existing?.display_name && existing.birth_year) {
          setAliasState({
            emotion: existing.emotion || '',
            nation: existing.nation || '',
            creature: existing.creature || '',
            emoji: existing.emoji || '',
            display_name: existing.display_name,
          })
          setStep('welcome')
        } else {
          setStep('age')
        }
      } catch { if (!cancelled) setStep('age') }
    }
    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (!data.session || isAnon(data.session.user)) {
        setStep('auth')
        return
      }
      await advanceForRealUser()
    }
    void run()
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'USER_UPDATED') return
      if (!session || isAnon(session.user)) return
      void advanceForRealUser()
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  // Cached in state so click handlers don't `await` before triggering the
  // OAuth redirect — popup blockers reject a location change that isn't
  // synchronous with the user gesture.
  const [anonSession, setAnonSession] = useState<boolean>(false)
  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (dead) return
      const u = data.session?.user as { is_anonymous?: boolean } | undefined
      setAnonSession(Boolean(u?.is_anonymous))
    })()
    return () => { dead = true }
  }, [])

  const runOAuth = async (provider: 'google' | 'apple') => {
    const redirectTo = window.location.origin + '/welcome'
    // If we have a real (non-anon) session already, nothing to do.
    // If anon, try to upgrade via linkIdentity so the auth.uid stays stable
    // and their existing spills/comments carry over. If manual identity
    // linking isn't enabled on the project, fall back to a plain sign-in.
    if (anonSession) {
      try {
        const { error } = await supabase.auth.linkIdentity({
          provider,
          options: { redirectTo },
        })
        if (!error) return // browser is redirecting
        const linkingUnsupported = /manual linking|not enabled|disabled|unsupported/i.test(error.message)
        const alreadyLinked = /already|exists|registered/i.test(error.message)
        if (!linkingUnsupported && !alreadyLinked) {
          setMsg({ kind: 'err', text: error.message })
          return
        }
        setMsg({ kind: 'err', text: 'signing you in — guest activity may stay with your guest account.' })
      } catch (e) {
        setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'link failed — trying regular sign-in' })
      }
    }
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: redirectTo })
    if (result.error) {
      setMsg({ kind: 'err', text: result.error.message || 'sign-in failed — provider may not be enabled' })
    }
  }

  const doOAuth = (provider: 'google' | 'apple') => {
    setBusy(true); setMsg(null)
    // Kick off synchronously so the popup/redirect is bound to the click.
    void runOAuth(provider).finally(() => setBusy(false))
  }

  const doEmail = async () => {
    const v = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      setMsg({ kind: 'err', text: 'enter a valid email' })
      return
    }
    setBusy(true); setMsg(null)
    try {
      const emailRedirectTo = window.location.origin + '/welcome'
      // Always fire signInWithOtp — Supabase sends BOTH a 6-digit code (if
      // the email template includes {{ .Token }}) and a magic link. The
      // in-app path we drive is the code path so mobile users don't lose
      // their session to app-switching (RULE 3).
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: v,
        options: { emailRedirectTo, shouldCreateUser: true },
      })
      if (otpErr) { setMsg({ kind: 'err', text: otpErr.message }); return }
      setEmailPhase('code')
      setMsg({ kind: 'ok', text: 'we emailed you a 6-digit code — enter it below (the magic link also works).' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'sign-in failed' })
    } finally {
      setBusy(false)
    }
  }

  const verifyEmailCode = async () => {
    const token = code.trim()
    if (!/^\d{6}$/.test(token)) {
      setMsg({ kind: 'err', text: 'enter the 6-digit code from the email' })
      return
    }
    setBusy(true); setMsg(null)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'email',
      })
      if (error) { setMsg({ kind: 'err', text: error.message }); return }
      // onAuthStateChange picks up SIGNED_IN and advances the flow.
      setMsg({ kind: 'ok', text: 'verified.' })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'verification failed' })
    } finally {
      setBusy(false)
    }
  }


  const confirmAge = () => {
    const dob = new Date(birth.year, birth.month - 1, birth.day)
    if (isNaN(dob.getTime())) { setMsg({ kind: 'err', text: 'pick a valid date' }); return }
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const m = now.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
    if (age < 18) {
      try { sessionStorage.setItem('shutap_age_rejected', '1') } catch { /* noop */ }
      setAgeBlocked(true)
      setMsg({ kind: 'err', text: 'shutap is 18+ only. account access is not available.' })
      return
    }
    setMsg(null); setStep('alias')
  }

  // Ensure a re-roll never returns the same triple twice in a row (RULE 5).
  const spin = () => setAliasState((prev) => {
    for (let i = 0; i < 8; i++) {
      const next = randomAliasParts()
      if (next.emotion !== prev.emotion || next.nation !== prev.nation || next.creature !== prev.creature) {
        return next
      }
    }
    return randomAliasParts()
  })

  const keepAlias = async () => {
    setBusy(true); setMsg(null)
    try {
      const saved = await upsertMyAlias({
        data: {
          emotion: alias.emotion,
          nation: alias.nation,
          creature: alias.creature,
          emoji,
          display_name: alias.display_name,
          birth_year: birth.year,
          birth_month: birth.month,
          birth_day: birth.day,
        },
      })
      const savedTyped = saved as { display_name?: string; emoji?: string } | null
      setAlias({
        name: savedTyped?.display_name ?? alias.display_name,
        emoji: savedTyped?.emoji ?? emoji,
      })
      await recordLegalAcceptance({ data: {} }).catch(() => {})
      try {
        const { trackEvent } = await import('@/lib/tracking')
        void trackEvent('alias_minted', { display_name: alias.display_name })
      } catch { /* noop */ }
      setStep('welcome')
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : 'save failed' })
    } finally {
      setBusy(false)
    }
  }

  const enterRoom = () => {
    try {
      // Generalized intent resume (RULE 2). Any interaction that redirected
      // to /welcome captured a shutap_pending_intent describing what to do.
      const raw = sessionStorage.getItem('shutap_pending_intent')
      if (raw) {
        sessionStorage.removeItem('shutap_pending_intent')
        const intent = JSON.parse(raw) as
          | { kind: 'spill' } | { kind: 'scan' } | { kind: 'subscribe' }
          | { kind: 'comment' | 'relate' | 'react'; roomId: string }
          | { kind: 'custom'; url: string }
        if (intent.kind === 'spill') { window.location.replace('/#spill'); return }
        if (intent.kind === 'scan') { window.location.replace('/#scan'); return }
        if (intent.kind === 'subscribe') { window.location.replace('/subscribe'); return }
        if (intent.kind === 'custom') { window.location.replace(intent.url); return }
        if ('roomId' in intent && intent.roomId) {
          window.location.replace('/room?id=' + encodeURIComponent(intent.roomId)); return
        }
      }
      const pc = sessionStorage.getItem('shutap_pending_comment')
      if (pc) {
        const parsed = JSON.parse(pc) as { roomId?: string }
        if (parsed?.roomId) { window.location.replace('/room?id=' + encodeURIComponent(parsed.roomId)); return }
      }
      if (sessionStorage.getItem('shutap_pending_save')) {
        window.location.replace('/#spill'); return
      }
      const ret = sessionStorage.getItem('shutap_returnTo')
      if (ret) { sessionStorage.removeItem('shutap_returnTo'); window.location.replace(ret); return }
    } catch { /* noop */ }
    window.location.replace('/stream')
  }

  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @keyframes weblink {0%,34%,40%,78%,84%,100%{transform:scaleY(1)}37%,81%{transform:scaleY(.1)}}
        @keyframes wfadeUp {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes wslotIn {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .wstep{animation:wfadeUp .4s ease}
        .oauth-btn:hover{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.25)}
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {step === 'auth' && (
            <div className="wstep" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <EyeMark />
                <div style={{ marginTop: 20, fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-.04em', marginBottom: 10 }}>
                  shut<span style={{ color: ACCENT }}>ap</span>
                </div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 18, lineHeight: 1.45, color: SOFT, marginBottom: 4 }}>before the room hears you,</div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 18, lineHeight: 1.45, color: TEXT }}>you need a name.</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="oauth-btn" style={oauthBtn} disabled={busy} onClick={() => doOAuth('google')}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                  continue with Google
                </button>
                <button className="oauth-btn" style={oauthBtn} disabled={busy} onClick={() => doOAuth('apple')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={TEXT}><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  continue with Apple
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, margin: '6px 0' }}>
                  <div style={{ flex: 1, height: .5, background: 'rgba(255,255,255,.12)' }} />
                  <span style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13, color: MUTED }}>or</span>
                  <div style={{ flex: 1, height: .5, background: 'rgba(255,255,255,.12)' }} />
                </div>
                {emailPhase === 'input' && (
                  <div style={{ display: 'flex', gap: 9 }}>
                    <input
                      type="email"
                      placeholder="your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && doEmail()}
                      style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 12, padding: '13px 15px', color: TEXT, fontFamily: "'Inter',sans-serif", fontSize: 15, outline: 'none' }}
                    />
                    <button
                      onClick={doEmail}
                      disabled={busy}
                      style={{ padding: '13px 18px', background: ACCENT, border: 'none', borderRadius: 12, color: '#fff', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >go →</button>
                  </div>
                )}
                {emailPhase === 'code' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="email-code-step">
                    <div style={{ display: 'flex', gap: 9 }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="6-digit code"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
                        onKeyDown={(e) => e.key === 'Enter' && verifyEmailCode()}
                        style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 12, padding: '13px 15px', color: TEXT, fontFamily: "'Sora',sans-serif", fontSize: 20, letterSpacing: '.4em', outline: 'none', textAlign: 'center' }}
                      />
                      <button
                        onClick={verifyEmailCode}
                        disabled={busy}
                        style={{ padding: '13px 18px', background: ACCENT, border: 'none', borderRadius: 12, color: '#fff', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >verify →</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCode(''); setEmailPhase('input'); setMsg(null) }}
                      style={{ background: 'transparent', border: 0, color: MUTED, fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                    >use a different email</button>
                  </div>
                )}
                {msg && emailPhase === 'code' && (
                  <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13, color: msg.kind === 'err' ? ACCENT : SOFT }}>{msg.text}</div>
                )}
              </div>
              <div style={{ textAlign: 'center', fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 12.5, color: MUTED }}>
                18+ only · your real name is never attached to anything here
              </div>
            </div>
          )}

          {step === 'age' && (
            <div className="wstep" style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 22, lineHeight: 1.4, color: TEXT, marginBottom: 8 }}>one small thing first.</div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 15, color: SOFT, lineHeight: 1.55, maxWidth: '34ch', margin: '0 auto' }}>
                  shutap is 18 and over. some of what's shared here is honest in ways that need a little life experience to hold.
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: MUTED, marginBottom: 14 }}>your date of birth</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <select style={wheelSelect} value={birth.day} onChange={(e) => setBirth({ ...birth, day: +e.target.value })}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d} style={{ background: BG }}>{String(d).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select style={{ ...wheelSelect, minWidth: 110 }} value={birth.month} onChange={(e) => setBirth({ ...birth, month: +e.target.value })}>
                    {MONTHS.map((m, i) => (<option key={m} value={i + 1} style={{ background: BG }}>{m}</option>))}
                  </select>
                  <select style={wheelSelect} value={birth.year} onChange={(e) => setBirth({ ...birth, year: +e.target.value })}>
                    {Array.from({ length: maxYear - 1924 + 1 }, (_, i) => maxYear - i).map((y) => (
                      <option key={y} value={y} style={{ background: BG }}>{y}</option>
                    ))}
                  </select>
                </div>
                {msg && (
                  <div style={{ marginTop: 12, fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, color: msg.kind === 'err' ? ACCENT : '#f7b8d4' }}>{msg.text}</div>
                )}
              </div>
              {ageBlocked ? (
                <div data-testid="age-blocked" style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(231,84,138,.08)', border: '1px solid rgba(231,84,138,.35)', color: '#f7b8d4', fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, lineHeight: 1.5 }}>
                  shutap is 18 and over. this session is closed to account content. clear your browser session to try another day.
                </div>
              ) : (
                <button style={primaryBtn} onClick={confirmAge}>confirm →</button>
              )}
            </div>
          )}

          {step === 'alias' && (
            <div className="wstep" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: ACCENT, marginBottom: 14 }}>your name in the room</div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 18, lineHeight: 1.5, color: TEXT, marginBottom: 8 }}>it won't be yours. it will be the name the room knows you by.</div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 15, color: SOFT }}>one alias. always yours. never your real name.</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
                <div key={alias.display_name + 'emoji'} style={{ fontSize: 44, marginBottom: 16, animation: 'wslotIn .35s ease' }}>{emoji}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', minHeight: 52 }}>
                  <span key={alias.emotion} style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: '#f7b8d4', animation: 'wslotIn .35s ease' }}>{alias.emotion}</span>
                  <span style={{ color: ACCENT, fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18 }}>·</span>
                  <span key={alias.nation} style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: TEXT, animation: 'wslotIn .35s ease' }}>{alias.nation}</span>
                  <span style={{ color: ACCENT, fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 18 }}>·</span>
                  <span key={alias.creature} style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, color: TEXT, animation: 'wslotIn .35s ease' }}>{alias.creature}</span>
                </div>
              </div>
              {msg && (
                <div style={{ textAlign: 'center', fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, color: msg.kind === 'err' ? ACCENT : '#f7b8d4' }}>{msg.text}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button style={ghostBtn} onClick={spin} disabled={busy}>spin again</button>
                <button style={primaryBtn} onClick={keepAlias} disabled={busy}>this is me →</button>
              </div>
            </div>
          )}

          {step === 'welcome' && (
            <div className="wstep" style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center' }}>
              <EyeMark />
              <div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 26, color: '#f7b8d4', marginBottom: 10 }}>
                  welcome, {alias.display_name}
                </div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 16, lineHeight: 1.6, color: SOFT, maxWidth: '34ch', margin: '0 auto' }}>
                  the room knows you now. whatever you're carrying, you can put it down here.
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: '18px 20px', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 'none', marginTop: 3 }}><EyeMark size={22} /></div>
                <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 15.5, lineHeight: 1.55, color: TEXT }}>
                  when you're ready, tap the eye anytime. i'll be here.
                </div>
              </div>
              <button style={primaryBtn} onClick={enterRoom}>enter the room →</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
