/* Native port of the iframe's composerRoot sheet (public/shutap/Landing.dc.html §COMPOSER
   OVERLAY, lines ~395–415). Bottom sheet: eye + copy + text input + send, a Mirror shortcut
   row, and an AI reply area fed by /api/complete. Opened by the floating CompanionBubble. */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NEWSREADER = "'Newsreader', Georgia, serif"
const SORA = "'Sora', system-ui, sans-serif"

const COMPANION_SYS =
  "You are shutap's companion — a warm, most-perceptive-friend voice. Reply in 1–3 short sentences, lowercase, no lists, no clinical language. If the user seems to want to vent, gently invite them to 'spill it'. If they ask how they're doing, invite them to 'scan it'. If they ask what shutap is, answer briefly. Never diagnose; never give medical/legal advice."

export function CompanionComposer({ open, onClose, onSpill, onScan }: {
  open: boolean
  onClose: () => void
  onSpill: () => void
  onScan: () => void
}) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [reply, setReply] = useState<string>('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setReply('')
      queueMicrotask(() => inputRef.current?.focus())
    }
  }, [open])

  const send = useCallback(async () => {
    const v = (inputRef.current?.value || '').trim()
    if (!v || busy) return
    // simple intent routing (mirrors iframe openComposer heuristics)
    const low = v.toLowerCase()
    if (/(off my chest|vent|spill|need to talk|tell you)/.test(low)) { onClose(); onSpill(); return }
    if (/(how am i|scan|check in on me|read me)/.test(low)) { onClose(); onScan(); return }
    if (/mirror/.test(low)) { onClose(); navigate('/mirror'); return }
    setBusy(true)
    setReply('…')
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ system: COMPANION_SYS, prompt: v, max_tokens: 220 }),
      })
      const j = await res.json().catch(() => ({} as { text?: string; completion?: string }))
      const text = (j.text || j.completion || '').trim() || "i'm here — say a bit more?"
      setReply(text)
    } catch {
      setReply("i couldn't reach the network. try again in a moment.")
    } finally {
      setBusy(false)
    }
  }, [busy, navigate, onClose, onScan, onSpill])

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,5,14,.55)', backdropFilter: 'blur(6px)' }} />
      <div role="dialog" style={{ position: 'relative', width: '100%', maxWidth: 560, background: 'linear-gradient(160deg,#2e0d1a,#1a0a12)', border: '.5px solid rgba(255,255,255,.16)', borderRadius: '22px 22px 0 0', padding: 22, animation: 'slideUp .3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <svg viewBox="0 0 56 56" fill="none" style={{ width: 28, height: 28, flex: 'none', marginTop: 1 }}>
            <circle cx="28" cy="28" r="27" fill="#fdf0f5" />
            <rect x="15" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
            <rect x="29.5" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
            <ellipse cx="20.75" cy="31" rx="4" ry="5" fill="url(#pupG)" />
            <ellipse cx="35.25" cy="31" rx="4" ry="5" fill="url(#pupG)" />
          </svg>
          <div style={{ flex: 1, fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#f7e8f0', lineHeight: 1.5 }}>
            i'm the companion. tell me what's going on — i can find you a room, help you spill, scan how you're doing, or just answer.
          </div>
          <div onClick={onClose} role="button" style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13, color: '#9e7a8c', cursor: 'pointer', flex: 'none' }}>close</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 14, padding: '12px 14px' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder='"i need to get something off my chest" · "how am i doing?" · "family rooms" · "what is shutap?"'
            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f7e8f0', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 15 }}
          />
          <div onClick={send} role="button" style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13.5, color: '#e7548a', cursor: busy ? 'wait' : 'pointer', flex: 'none', opacity: busy ? 0.6 : 1 }}>send →</div>
        </div>
        <div onClick={() => { onClose(); navigate('/mirror') }} role="button" style={{ marginTop: 13, display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(231,84,138,.10)', border: '.5px solid rgba(231,84,138,.28)', borderRadius: 14, padding: '13px 15px', cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#f7b8d4" strokeWidth={1.6} style={{ width: 20, height: 20, flex: 'none' }}>
            <rect x="5" y="3" width="14" height="18" rx="7" />
            <path d="M9 8.5c1 1.2 5 1.2 6 0" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 13, color: '#f7e8f0' }}>the mirror</div>
            <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 12.5, color: '#caaebb', marginTop: 1 }}>what i've noticed about you, over time</div>
          </div>
          <span style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13, color: '#f7b8d4', flex: 'none' }}>open →</span>
        </div>
        {reply && (
          <div style={{ marginTop: 14, fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14.5, color: '#c4a0b2', lineHeight: 1.55 }}>{reply}</div>
        )}
      </div>
    </div>
  )
}
