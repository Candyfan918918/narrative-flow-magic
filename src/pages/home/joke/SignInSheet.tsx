// Sign-in sheet — a bottom sheet over the current screen. Never a route
// change, never a lost card. Email magic link only: no password, no social.
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

const SORA = "'Sora',system-ui,sans-serif"
const TERMS_VERSION = '2026-09-04'

export const SHEET_LEAD: Record<string, string> = {
  keep: "wanna keep this? grab a spot — pseudonymous, your real name never shows 🔒",
  second_flip: "that's your one for today. a spot gets you tomorrow's, and keeps the ones you've flipped.",
  share: 'sharing needs a spot — so the card has a name on it that is not yours.',
  download: 'downloading needs a spot. takes ten seconds, no password.',
  post: 'posting to a room needs a spot — rooms are pseudonymous, never your real name.',
  checkout: 'grab a spot first, then all three flip.',
}

export function SignInSheet({
  open,
  trigger,
  onClose,
}: {
  open: boolean
  trigger: string
  onClose: () => void
}) {
  const [email, setEmail] = useState('')
  const [ok18, setOk18] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  async function send() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErr('that address did not look right. try again?')
      return
    }
    if (!ok18) {
      setErr('need the 18+ box ticked before i can make you a spot.')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      try { localStorage.setItem('shutap_terms', JSON.stringify({ version: TERMS_VERSION, at: new Date().toISOString() })) } catch { /* noop */ }
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.href, shouldCreateUser: true },
      })
      if (error) { setErr('that did not send. try again in a moment?'); return }
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(11,8,15,.5)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: 'min(460px,100%)', background: '#fff', borderRadius: '24px 24px 0 0', padding: '22px 20px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ width: 44, height: 4, borderRadius: 99, background: 'rgba(11,8,15,.12)', margin: '0 auto 4px' }} />
        <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 19, lineHeight: 1.45, color: '#2b2429' }}>
          {SHEET_LEAD[trigger] ?? SHEET_LEAD.keep}
        </div>

        {!sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@wherever.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', height: 48, border: '1.5px solid rgba(231,84,138,.35)', borderRadius: 14, padding: '0 15px', fontSize: 16, outline: 'none', background: '#fff', color: '#0b080f' }}
            />
            <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontFamily: SORA, fontSize: 13, color: '#6b4a5c', lineHeight: 1.5 }}>
              <input type="checkbox" checked={ok18} onChange={(e) => setOk18(e.target.checked)} style={{ marginTop: 3, width: 17, height: 17, accentColor: '#8e1c4c', flex: 'none' }} />
              <span>i'm 18 or over, and i accept the terms and privacy notice.</span>
            </label>
            {err ? <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 15, color: '#a8003f' }}>{err}</div> : null}
            <button onClick={() => void send()} disabled={busy} className="pill pill-wine" style={{ height: 48, justifyContent: 'center', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'sending…' : 'send me a link'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SORA, fontSize: 13, color: '#8a7a84', padding: 6 }}>
              not now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, alignItems: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 17, color: '#2b2429', textAlign: 'center' }}>
              check your inbox — link's on its way from hello@shutap.com. open it on this device and your card is still right here.
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: SORA, fontSize: 13, color: '#8a7a84', padding: 6 }}>
              close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
