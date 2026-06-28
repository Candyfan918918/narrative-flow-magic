/* Reactive Welcome — sign-in + birthday gate + alias ceremony, all React.
 * Replaces the iframe Welcome.dc.html bridge. */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lovable } from '@/integrations/lovable'
import { supabase } from '@/integrations/supabase/client'
import { recordLegalAcceptance } from '@/lib/legal.functions'
import { setAlias as saveAlias } from '@/lib/auth'

const PINK = '#c1216b'
const PALETTE = ['🌸','✨','🌿','🌙','☁️','🔥','💧','🪷','🦋','🍓','🌻','🫧']

type Phase = 'gate' | 'auth' | 'birthday' | 'alias' | 'done'

export function WelcomePage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('auth')
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [bday, setBday] = useState('')
  const [aliasName, setAliasName] = useState('')
  const [emoji, setEmoji] = useState(PALETTE[0])
  const [pending, setPending] = useState(false)

  // detect existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        sessionStorage.setItem('shutap_authed', '1')
        recordLegalAcceptance({ data: {} }).catch(() => {})
        setPhase('birthday')
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        recordLegalAcceptance({ data: {} }).catch(() => {})
        if (sessionStorage.getItem('shutap_pending_save')) navigate('/')
        else setPhase('birthday')
      }
    })
    return () => { sub.subscription.unsubscribe() }
  }, [navigate])

  async function signInOAuth(method: 'google' | 'apple') {
    setPending(true); setMsg('')
    try {
      const res = await lovable.auth.signInWithOAuth(method, { redirect_uri: window.location.origin + '/welcome' })
      if (res.error) setMsg(res.error.message || 'sign-in failed')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'sign-in failed') }
    finally { setPending(false) }
  }
  async function signInEmail(e: React.FormEvent) {
    e.preventDefault()
    setPending(true); setMsg('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/welcome' } })
      if (error) setMsg(error.message); else setMsg('magic link sent — check your inbox.')
    } finally { setPending(false) }
  }

  function submitBirthday(e: React.FormEvent) {
    e.preventDefault()
    if (!bday) return
    const age = (Date.now() - new Date(bday).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (age < 16) { setMsg('shutap is 16+. take care of you.'); return }
    setPhase('alias')
  }

  function finishAlias(e: React.FormEvent) {
    e.preventDefault()
    if (!aliasName.trim()) return
    saveAlias({ name: aliasName.trim().slice(0, 24), emoji })
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
      <div style={card}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '.2em', color: PINK }}>SHUTAP ✦ WELCOME</div>

        {phase === 'auth' && (
          <>
            <h1 style={h1}>come in. no real name, ever.</h1>
            <p style={lede}>pick a way to sign in. we use it to keep your spills safe across devices — that's it.</p>
            <button onClick={() => signInOAuth('google')} disabled={pending} style={oauthBtn}>continue with Google</button>
            <button onClick={() => signInOAuth('apple')} disabled={pending} style={{ ...oauthBtn, marginTop: 8 }}>continue with Apple</button>
            <div style={{ textAlign: 'center', color: '#9e7a8c', margin: '14px 0 8px', fontSize: 12 }}>or</div>
            <form onSubmit={signInEmail}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email" style={input} required />
              <button type="submit" disabled={pending || !email} style={{ ...primaryBtn, marginTop: 10, width: '100%' }}>email me a magic link</button>
            </form>
            {msg && <p style={hint}>{msg}</p>}
          </>
        )}

        {phase === 'birthday' && (
          <>
            <h1 style={h1}>quick — when were you born?</h1>
            <p style={lede}>16+ only. we keep this private; we never show your real age.</p>
            <form onSubmit={submitBirthday}>
              <input type="date" value={bday} onChange={(e) => setBday(e.target.value)} style={input} required />
              <button type="submit" style={{ ...primaryBtn, marginTop: 10, width: '100%' }}>that's me →</button>
            </form>
            {msg && <p style={hint}>{msg}</p>}
          </>
        )}

        {phase === 'alias' && (
          <>
            <h1 style={h1}>pick a name only you and i know.</h1>
            <p style={lede}>this is who you'll be inside shutap. lowercase, made up, soft.</p>
            <form onSubmit={finishAlias}>
              <input value={aliasName} onChange={(e) => setAliasName(e.target.value.toLowerCase())} placeholder="petal · sky · 99" style={input} required maxLength={24} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {PALETTE.map(p => (
                  <button key={p} type="button" onClick={() => setEmoji(p)}
                    style={{ ...emojiBtn, background: emoji === p ? PINK : '#fff', color: emoji === p ? '#fff' : '#0b080f' }}>{p}</button>
                ))}
              </div>
              <button type="submit" style={{ ...primaryBtn, marginTop: 16, width: '100%' }}>step inside →</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 8px 30px rgba(11,8,15,.06)' }
const h1: React.CSSProperties = { fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 24, margin: '12px 0 8px', color: '#0b080f' }
const lede: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#4a3040', marginBottom: 18, fontSize: 15 }
const oauthBtn: React.CSSProperties = { display: 'block', width: '100%', background: '#fff', color: '#0b080f', border: '.5px solid rgba(11,8,15,.18)', borderRadius: 999, padding: '12px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const input: React.CSSProperties = { width: '100%', border: '.5px solid rgba(11,8,15,.15)', borderRadius: 12, padding: '12px 14px', fontFamily: 'Inter,sans-serif', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
const primaryBtn: React.CSSProperties = { background: PINK, color: '#fff', border: 0, borderRadius: 999, padding: '12px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const emojiBtn: React.CSSProperties = { fontSize: 18, width: 36, height: 36, borderRadius: 999, border: '.5px solid rgba(11,8,15,.1)', cursor: 'pointer' }
const hint: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#9e7a8c', marginTop: 10, fontSize: 13 }
