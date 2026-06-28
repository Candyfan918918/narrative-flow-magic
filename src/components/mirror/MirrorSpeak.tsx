/* The Mirror "sit with the mirror" speak channel — real reflective chat. */
import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { mirrorSpeak } from '@/lib/agents/mirror-speak.functions'
import type { MirrorPortrait } from '@/lib/mirror.functions'
import { track } from '@/lib/behavioral'

const ACCENT = '#7F77DD'

export function MirrorSpeakSheet({ open, onClose, portrait }: { open: boolean; onClose: () => void; portrait: MirrorPortrait | undefined }) {
  const call = useServerFn(mirrorSpeak)
  const [transcript, setTranscript] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chips, setChips] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const scroll = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setTranscript([]); setChips([])
    void send(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'smooth' }) }, [transcript])

  async function send(text: string | null) {
    if (pending) return
    const next = text ? [...transcript, { role: 'user' as const, content: text }] : transcript
    if (text) { setTranscript(next); setInput(''); track('mirror_session_turn') }
    setPending(true)
    try {
      const memory = {
        spills: portrait?.spill_count ?? 0,
        scans: portrait?.scan_count ?? 0,
        top_pillar: portrait?.top_pillar ?? null,
        trend: portrait?.trend ?? 'forming',
        latest_score: portrait?.score_series.slice(-1)[0]?.score ?? null,
      }
      const r = await call({ data: { transcript: next, memory } })
      setTranscript(prev => [...prev, { role: 'assistant', content: r.say }])
      setChips(r.chips || [])
    } finally { setPending(false) }
  }

  if (!open) return null
  return (
    <div style={overlay}>
      <div style={sheet} role="dialog" aria-modal="true">
        <div style={header}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '.18em', color: ACCENT }}>SIT WITH THE MIRROR ✦</div>
          <button onClick={onClose} aria-label="close" style={closeBtn}>×</button>
        </div>
        <div ref={scroll} style={body}>
          {transcript.map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: t.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={t.role === 'user' ? userBubble : mirrorBubble}>{t.content}</div>
            </div>
          ))}
          {pending && <div style={{ ...mirrorBubble, opacity: .6 }}>…</div>}
          {chips.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {chips.map(c => <button key={c} onClick={() => send(c)} style={chipBtn}>{c}</button>)}
            </div>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) void send(input.trim()) }} style={composer}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="say what's underneath…" style={textInput} />
          <button type="submit" disabled={pending || !input.trim()} style={sendBtn}>send</button>
        </form>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(11,8,15,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 80 }
const sheet: React.CSSProperties = { background: '#fdfaff', width: '100%', maxWidth: 560, height: '92vh', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column' }
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '.5px solid rgba(11,8,15,.06)' }
const closeBtn: React.CSSProperties = { border: 0, background: 'transparent', fontSize: 28, cursor: 'pointer', color: '#9e7a8c', lineHeight: 1 }
const body: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '18px 22px 4px' }
const mirrorBubble: React.CSSProperties = { background: '#fff', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 16, color: '#0b080f', maxWidth: '85%', border: `.5px solid ${ACCENT}22`, lineHeight: 1.4 }
const userBubble: React.CSSProperties = { background: ACCENT, color: '#fff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontFamily: 'Inter,sans-serif', fontSize: 14, maxWidth: '85%' }
const chipBtn: React.CSSProperties = { background: '#fff', border: `.5px solid ${ACCENT}55`, color: ACCENT, borderRadius: 999, padding: '6px 12px', fontFamily: 'Sora,sans-serif', fontSize: 12, cursor: 'pointer' }
const composer: React.CSSProperties = { display: 'flex', gap: 8, padding: 12, borderTop: '.5px solid rgba(11,8,15,.06)', background: '#fdfaff' }
const textInput: React.CSSProperties = { flex: 1, border: `.5px solid ${ACCENT}33`, borderRadius: 999, padding: '10px 16px', fontFamily: 'Inter,sans-serif', fontSize: 14, outline: 'none' }
const sendBtn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
