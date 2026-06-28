/* Spill v2 — react-first interview sheet. Slide-up overlay. Pink theme,
 * Newsreader italic for the spill's bubbles, real server turn engine. */
import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useNavigate } from 'react-router-dom'
import { spillTurn, type SpillTurnResult } from '@/lib/agents/spill-turn.functions'
import { spillCompose, spillEdit, type ComposeOutput } from '@/lib/agents/spill-compose.functions'
import { saveSituation } from '@/lib/situations.functions'
import { getAlias } from '@/lib/auth'
import { track } from '@/lib/behavioral'
import { supabase } from '@/integrations/supabase/client'

type Turn = { role: 'user' | 'assistant'; content: string }
type Arc = SpillTurnResult['updated']['arc']

const ACCENT = '#c1216b'
const BG = '#fdf0f5'

export function SpillSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const alias = getAlias()
  const aliasName = alias?.name || 'friend'
  const callTurn = useServerFn(spillTurn)
  const callCompose = useServerFn(spillCompose)
  const callEdit = useServerFn(spillEdit)
  const callSave = useServerFn(saveSituation)

  const [transcript, setTranscript] = useState<Turn[]>([])
  const [arc, setArc] = useState<Arc>({})
  const [pillar, setPillar] = useState<string | null>(null)
  const [bubbles, setBubbles] = useState<{ role: 'user' | 'spill'; text: string; question?: boolean }[]>([])
  const [pending, setPending] = useState(false)
  const [phase, setPhase] = useState<'chat' | 'support' | 'composing' | 'preview' | 'saving'>('chat')
  const [supportMode, setSupportMode] = useState<'heard' | 'advice'>('heard')
  const [draft, setDraft] = useState<ComposeOutput | null>(null)
  const [editInstruction, setEditInstruction] = useState('')
  const [crisis, setCrisis] = useState(false)
  const [notice, setNotice] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')

  // open lifecycle: send opener turn
  useEffect(() => {
    if (!open) return
    setTranscript([])
    setBubbles([])
    setArc({})
    setPhase('chat')
    setDraft(null)
    setCrisis(false)
    setNotice('')
    track('spill_started', { alias: aliasName })
    ;(async () => {
      setPending(true)
      try {
        const res = await callTurn({
          data: { alias: aliasName, transcript: [], arc: {}, humor_ok: true, turn_count: 0 },
        })
        for (const b of res.say) setBubbles(prev => [...prev, { role: 'spill', text: b, question: false }])
        setTranscript([{ role: 'assistant', content: res.say.join(' ') }])
        if (res.crisis) setCrisis(true)
      } finally { setPending(false) }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [bubbles, phase])

  async function send() {
    const text = input.trim()
    if (!text || pending) return
    setInput('')
    setBubbles(prev => [...prev, { role: 'user', text }])
    const nextTranscript = [...transcript, { role: 'user' as const, content: text }]
    setTranscript(nextTranscript)
    setPending(true)
    try {
      const res = await callTurn({
        data: {
          alias: aliasName,
          transcript: nextTranscript,
          arc,
          humor_ok: true,
          turn_count: Math.floor(nextTranscript.length / 2),
          pillar: (pillar as never) ?? undefined,
        },
      })
      if (res.notice) setNotice(res.notice)
      if (res.crisis) { setCrisis(true); for (const b of res.say) setBubbles(prev => [...prev, { role: 'spill', text: b }]); return }
      for (const b of res.say) setBubbles(prev => [...prev, { role: 'spill', text: b, question: res.has_question && b === res.say[res.say.length - 1] }])
      setTranscript(prev => [...prev, { role: 'assistant', content: res.say.join(' ') }])
      setArc(res.updated.arc)
      if (res.updated.pillar) setPillar(res.updated.pillar)
      track('spill_turn', { has_question: res.has_question, lever: res.relief_lever })
      if (res.decision === 'ready') {
        setTimeout(() => setPhase('support'), 600)
      }
    } finally { setPending(false) }
  }

  async function chooseSupport(mode: 'heard' | 'advice') {
    setSupportMode(mode)
    setPhase('composing')
    track('spill_completed', { pillar, support: mode })
    const out = await callCompose({
      data: {
        transcript,
        arc: Object.fromEntries(Object.entries(arc).map(([k, v]) => [k, (v ?? null) as string | null])),
        pillar: (pillar as never) ?? undefined,
        support_mode: mode,
        alias: aliasName,
      },
    })
    setDraft(out)
    setPhase('preview')
  }

  async function runEdit() {
    if (!draft || !editInstruction.trim()) return
    setPending(true)
    try {
      const out = await callEdit({
        data: { title: draft.title, body: draft.body, instruction: editInstruction.trim(), transcript },
      })
      setDraft(out)
      setEditInstruction('')
      if (out.notice) setNotice(out.notice)
      track('spill_ai_edit', { instruction: editInstruction.slice(0, 80) })
    } finally { setPending(false) }
  }

  async function publish(isPublic: boolean) {
    if (!draft) return
    setPhase('saving')
    try {
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) {
        sessionStorage.setItem('shutap_pending_save', JSON.stringify({
          kind: 'spill', pillar: pillar || 'relationships',
          clean_text: transcript.map(t => t.content).join('\n\n'),
          title: draft.title, body: draft.body, tags: draft.tags, is_public: isPublic,
          alias: aliasName, emoji: alias?.emoji ?? '🌸',
        }))
        navigate('/welcome')
        return
      }
      const res = await callSave({
        data: {
          kind: 'spill',
          pillar: (pillar as never) || 'relationships',
          clean_text: transcript.map(t => t.content).join('\n\n'),
          title: draft.title,
          body: draft.body,
          tags: draft.tags,
          is_public: isPublic,
          alias: aliasName,
          emoji: alias?.emoji ?? '🌸',
        },
      })
      if (isPublic && res.room_id) {
        track('room_created', { pillar })
        navigate(`/room?id=${res.id}`)
      } else {
        track('journal_created', { pillar })
        navigate('/profile')
      }
      onClose()
    } catch (e) {
      console.error(e)
      setPhase('preview')
    }
  }

  if (!open) return null

  return (
    <div style={overlay}>
      <div style={sheet} role="dialog" aria-modal="true">
        <div style={header}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '.16em', color: ACCENT }}>SPILL ✦</div>
          <button onClick={onClose} aria-label="close" style={closeBtn}>×</button>
        </div>

        {phase === 'chat' && (
          <>
            <div ref={scrollRef} style={chatScroll}>
              {bubbles.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: b.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <div style={b.role === 'user' ? userBubble : (b.question ? spillBubbleQ : spillBubble)}>{b.text}</div>
                </div>
              ))}
              {pending && <div style={{ ...spillBubble, opacity: .6 }}>…</div>}
              {notice && <div style={noticeChip}>🔒 {notice}</div>}
              {crisis && <div style={{ marginTop: 16, color: ACCENT, fontSize: 13 }}>resources will be shown — please reach out.</div>}
            </div>
            {!crisis && (
              <form onSubmit={(e) => { e.preventDefault(); void send() }} style={composer}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
                  placeholder="say more…"
                  rows={1}
                  style={textarea}
                  disabled={pending}
                />
                <button type="submit" disabled={pending || !input.trim()} style={sendBtn}>send</button>
              </form>
            )}
          </>
        )}

        {phase === 'support' && (
          <div style={{ padding: 24 }}>
            <p style={prompt}>before i write this up — what helps right now?</p>
            <button style={pillBtn} onClick={() => chooseSupport('heard')}>just to be heard</button>
            <button style={{ ...pillBtn, marginTop: 10 }} onClick={() => chooseSupport('advice')}>actually, give me advice</button>
          </div>
        )}

        {phase === 'composing' && <div style={{ padding: 30, fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: ACCENT }}>writing it up in your voice…</div>}

        {phase === 'preview' && draft && (
          <div ref={scrollRef} style={chatScroll}>
            {notice && <div style={noticeChip}>🔒 {notice}</div>}
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              style={titleInput}
            />
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={Math.max(6, Math.min(20, draft.body.split('\n').length + 2))}
              style={bodyInput}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {draft.tags.map((t, i) => (
                <span key={i} style={tagChip}>#{t}</span>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: 14, background: '#fff5fa', borderRadius: 12, border: `.5px solid ${ACCENT}22` }}>
              <div style={{ fontSize: 11, fontFamily: 'Sora,sans-serif', fontWeight: 700, color: ACCENT, letterSpacing: '.14em', marginBottom: 8 }}>EDIT WITH SPILL</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder='"make it shorter" · "add the part about the rent"'
                  style={{ ...textarea, padding: '10px 12px' }}
                />
                <button onClick={() => void runEdit()} disabled={pending || !editInstruction.trim()} style={sendBtn}>edit</button>
              </div>
              {draft.needs_clarification && (
                <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#7a3a5a', marginTop: 10 }}>
                  i need one more thing: {draft.needs_clarification}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => void publish(true)} style={{ ...primaryBtn, flex: 1 }}>post to a room →</button>
              <button onClick={() => void publish(false)} style={{ ...ghostBtn, flex: 1 }}>keep as journal</button>
            </div>
          </div>
        )}

        {phase === 'saving' && <div style={{ padding: 30, fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: ACCENT }}>saving…</div>}
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(11,8,15,.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 80 }
const sheet: React.CSSProperties = { background: BG, width: '100%', maxWidth: 560, height: '92vh', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,.18)' }
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '.5px solid rgba(11,8,15,.06)' }
const closeBtn: React.CSSProperties = { border: 0, background: 'transparent', fontSize: 28, cursor: 'pointer', color: '#9e7a8c', lineHeight: 1 }
const chatScroll: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '18px 18px 4px' }
const spillBubble: React.CSSProperties = { background: '#fff', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 16, color: '#0b080f', maxWidth: '85%', lineHeight: 1.4 }
const spillBubbleQ: React.CSSProperties = { ...spillBubble, background: '#fff5fa', border: `.5px solid ${ACCENT}33` }
const userBubble: React.CSSProperties = { background: ACCENT, color: '#fff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontFamily: 'Inter,sans-serif', fontSize: 14, maxWidth: '85%' }
const composer: React.CSSProperties = { display: 'flex', gap: 8, padding: 12, borderTop: '.5px solid rgba(11,8,15,.06)', background: BG }
const textarea: React.CSSProperties = { flex: 1, border: '.5px solid rgba(11,8,15,.15)', borderRadius: 14, padding: '10px 14px', fontFamily: 'Inter,sans-serif', fontSize: 14, resize: 'none', outline: 'none', background: '#fff' }
const sendBtn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 0, borderRadius: 999, padding: '10px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
const primaryBtn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 0, borderRadius: 999, padding: '12px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { background: '#fff', color: ACCENT, border: `.5px solid ${ACCENT}55`, borderRadius: 999, padding: '12px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
const pillBtn: React.CSSProperties = { display: 'block', width: '100%', background: '#fff', border: `.5px solid ${ACCENT}55`, color: '#0b080f', borderRadius: 16, padding: '14px 18px', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 17, cursor: 'pointer', textAlign: 'left' }
const prompt: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 19, marginBottom: 18, color: '#0b080f' }
const noticeChip: React.CSSProperties = { background: '#fff', border: `.5px solid ${ACCENT}33`, borderRadius: 999, padding: '6px 12px', fontFamily: 'Inter,sans-serif', fontSize: 12, color: ACCENT, display: 'inline-block', marginBottom: 12 }
const titleInput: React.CSSProperties = { width: '100%', border: 0, borderBottom: '.5px solid rgba(11,8,15,.15)', padding: '8px 0', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 22, background: 'transparent', outline: 'none', marginBottom: 8 }
const bodyInput: React.CSSProperties = { width: '100%', border: '.5px solid rgba(11,8,15,.12)', borderRadius: 12, padding: 12, fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, background: '#fff', outline: 'none', resize: 'vertical' }
const tagChip: React.CSSProperties = { background: '#fff', border: `.5px solid ${ACCENT}33`, color: ACCENT, borderRadius: 999, padding: '4px 10px', fontFamily: 'Sora,sans-serif', fontSize: 11 }
