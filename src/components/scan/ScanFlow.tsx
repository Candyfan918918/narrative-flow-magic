/* Scan v2 — adaptive React flow. Indigo theme, varied widgets driven by the
 * server scan-turn engine. On done → ScanResult with share card. */
import { useEffect, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useNavigate } from 'react-router-dom'
import { scanTurnV2, type ScanCard, type ScanTurnResult } from '@/lib/agents/scan-turn-v2.functions'
import { saveSituation } from '@/lib/situations.functions'
import { getAlias } from '@/lib/auth'
import { track } from '@/lib/behavioral'
import { supabase } from '@/integrations/supabase/client'
import { ScanShareCard, bandFor } from './ScanShareCard'

const ACCENT = '#7F77DD'

type Turn = { prompt: string; card_type: string; answer?: string | string[] | number }

export function ScanFlow({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const alias = getAlias()
  const aliasName = alias?.name || 'friend'
  const callTurn = useServerFn(scanTurnV2)
  const callSave = useServerFn(saveSituation)

  const [transcript, setTranscript] = useState<Turn[]>([])
  const [card, setCard] = useState<{ prompt: string; line: string; card: ScanCard } | null>(null)
  const [result, setResult] = useState<Extract<ScanTurnResult, { done: true; crisis?: false }> | null>(null)
  const [crisis, setCrisis] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    setTranscript([]); setCard(null); setResult(null); setCrisis(null)
    track('scan_started', { alias: aliasName })
    void next([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function next(t: Turn[]) {
    setPending(true)
    try {
      const r = await callTurn({ data: { alias: aliasName, transcript: t } })
      if ('crisis' in r && r.crisis) { setCrisis(r.line); return }
      if (r.done) {
        setResult(r as Extract<ScanTurnResult, { done: true; crisis?: false }>)
        track('scan_done', { score: (r as { score: number }).score, pillar: (r as { pillar: string }).pillar })
      } else {
        setCard({ prompt: r.prompt, line: r.line, card: r.card })
        track('scan_card', { type: r.card.type, index: t.length })
      }
    } finally { setPending(false) }
  }

  function submit(answer: string | string[] | number) {
    if (!card) return
    const t = [...transcript, { prompt: card.prompt, card_type: card.card.type, answer }]
    setTranscript(t)
    setCard(null)
    void next(t)
  }

  async function publish(isPublic: boolean) {
    if (!result) return
    const { data: sess } = await supabase.auth.getSession()
    const payload = {
      kind: 'scan' as const,
      pillar: (['relationships','marriage','family','career'].includes(result.pillar) ? result.pillar : 'relationships') as never,
      clean_text: result.read,
      title: result.signature,
      body: result.read,
      tags: result.factors,
      initial_scan: result.score,
      scan_band: bandFor(result.score).key as 'quiet'|'real'|'hot'|'heavy'|'serious',
      is_public: isPublic,
      alias: aliasName,
      emoji: alias?.emoji ?? '🌸',
    }
    if (!sess.session) {
      sessionStorage.setItem('shutap_pending_save', JSON.stringify(payload))
      navigate('/welcome')
      return
    }
    const res = await callSave({ data: payload })
    if (isPublic && res.room_id) navigate(`/room?id=${res.id}`)
    else navigate('/profile')
    onClose()
  }

  if (!open) return null

  return (
    <div style={overlay}>
      <div style={sheet} role="dialog" aria-modal="true">
        <div style={header}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '.18em', color: ACCENT }}>SCAN ✦</div>
          <div style={{ flex: 1, margin: '0 16px', height: 3, background: '#eee5fa', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (transcript.length / 10) * 100)}%`, height: '100%', background: ACCENT, transition: 'width .4s' }} />
          </div>
          <button onClick={onClose} aria-label="close" style={closeBtn}>×</button>
        </div>

        <div style={body}>
          {crisis && <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: ACCENT }}>{crisis}</p>}
          {!crisis && !result && card && (
            <CardView card={card.card} line={card.line} prompt={card.prompt} onSubmit={submit} disabled={pending} />
          )}
          {!crisis && !result && !card && pending && (
            <div style={{ color: ACCENT, fontFamily: 'Newsreader,serif', fontStyle: 'italic' }}>reading you…</div>
          )}
          {!crisis && result && (
            <ResultView result={result} alias={aliasName} onPublish={publish} />
          )}
        </div>
      </div>
    </div>
  )
}

function CardView({ card, line, prompt, onSubmit, disabled }: { card: ScanCard; line: string; prompt: string; onSubmit: (a: string | string[] | number) => void; disabled: boolean }) {
  return (
    <div>
      {line && <p style={lineStyle}>{line}</p>}
      <h2 style={promptStyle}>{prompt}</h2>
      <CardInput card={card} disabled={disabled} onSubmit={onSubmit} />
    </div>
  )
}

function CardInput({ card, disabled, onSubmit }: { card: ScanCard; disabled: boolean; onSubmit: (a: string | string[] | number) => void }) {
  const [text, setText] = useState('')
  const [multi, setMulti] = useState<string[]>([])
  const [rate, setRate] = useState((('min' in card ? (card.min ?? 0) : 0) + (('max' in card ? (card.max ?? 10) : 10))) / 2)
  const [spec, setSpec] = useState(50)
  const [order, setOrder] = useState<string[]>('items' in card ? [...card.items] : [])
  const draggingIdx = useRef<number | null>(null)

  if (card.type === 'choice') return (
    <div style={{ display: 'grid', gap: 8 }}>
      {card.options.map(o => (
        <button key={o} disabled={disabled} onClick={() => onSubmit(o)} style={choiceBtn}>{o}</button>
      ))}
    </div>
  )
  if (card.type === 'multi') return (
    <div>
      <div style={{ display: 'grid', gap: 8 }}>
        {card.options.map(o => {
          const on = multi.includes(o)
          return (
            <button key={o} disabled={disabled} onClick={() => setMulti(m => on ? m.filter(x => x !== o) : ((card.max && m.length >= card.max) ? m : [...m, o]))}
              style={{ ...choiceBtn, background: on ? ACCENT : '#fff', color: on ? '#fff' : '#0b080f' }}>{o}</button>
          )
        })}
      </div>
      <button disabled={disabled || multi.length === 0} onClick={() => onSubmit(multi)} style={{ ...primaryBtn, marginTop: 14 }}>next →</button>
    </div>
  )
  if (card.type === 'rate') {
    const min = card.min ?? 0, max = card.max ?? 10
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sora,sans-serif', fontSize: 11, color: '#6b4a5c', letterSpacing: '.1em' }}>
          <span>{card.min_label.toUpperCase()}</span><span>{card.max_label.toUpperCase()}</span>
        </div>
        <input type="range" min={min} max={max} step={1} value={rate} onChange={e => setRate(Number(e.target.value))} style={slider} />
        <div style={{ textAlign: 'center', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 28, color: ACCENT }}>{rate}</div>
        <button disabled={disabled} onClick={() => onSubmit(rate)} style={{ ...primaryBtn, marginTop: 12, width: '100%' }}>next →</button>
      </div>
    )
  }
  if (card.type === 'spectrum') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sora,sans-serif', fontSize: 11, color: '#6b4a5c', letterSpacing: '.1em' }}>
          <span>{card.left.toUpperCase()}</span><span>{card.right.toUpperCase()}</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={spec} onChange={e => setSpec(Number(e.target.value))} style={slider} />
        <button disabled={disabled} onClick={() => onSubmit(`${spec}/100`)} style={{ ...primaryBtn, marginTop: 12, width: '100%' }}>next →</button>
      </div>
    )
  }
  if (card.type === 'rank') {
    return (
      <div>
        <p style={{ fontFamily: 'Sora,sans-serif', fontSize: 12, color: '#6b4a5c', marginBottom: 10 }}>drag to order — biggest on top</p>
        <div style={{ display: 'grid', gap: 6 }}>
          {order.map((item, i) => (
            <div
              key={item}
              draggable
              onDragStart={() => { draggingIdx.current = i }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = draggingIdx.current; draggingIdx.current = null
                if (from === null || from === i) return
                const next = [...order]; const [m] = next.splice(from, 1); next.splice(i, 0, m); setOrder(next)
              }}
              style={{ ...choiceBtn, cursor: 'grab', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span>{item}</span><span style={{ color: '#9e7a8c', fontSize: 11 }}>{i + 1}</span>
            </div>
          ))}
        </div>
        <button disabled={disabled} onClick={() => onSubmit(order)} style={{ ...primaryBtn, marginTop: 14, width: '100%' }}>next →</button>
      </div>
    )
  }
  // text
  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder={('placeholder' in card && card.placeholder) || 'a few words'} style={textInput} />
      <button disabled={disabled || !text.trim()} onClick={() => onSubmit(text.trim())} style={{ ...primaryBtn, marginTop: 12, width: '100%' }}>next →</button>
    </div>
  )
}

function ResultView({ result, alias, onPublish }: { result: Extract<ScanTurnResult, { done: true; crisis?: false }>; alias: string; onPublish: (p: boolean) => void }) {
  const band = bandFor(result.score)
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16, fontFamily: 'Sora,sans-serif', fontSize: 11, color: ACCENT, letterSpacing: '.18em' }}>YOUR READ</div>
      <ScanShareCard score={result.score} signature={result.signature} read={result.read} pillar={result.pillar} alias={alias} />
      <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {result.factors.map(f => <span key={f} style={{ ...choiceBtn, padding: '6px 12px', fontSize: 12, background: '#fff', color: '#0b080f', cursor: 'default' }}>{f}</span>)}
      </div>
      <p style={{ ...lineStyle, marginTop: 18 }}><strong style={{ color: ACCENT }}>{band.word}</strong> · {result.read}</p>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button onClick={() => onPublish(true)} style={{ ...primaryBtn, flex: 1 }}>post to a room →</button>
        <button onClick={() => onPublish(false)} style={{ ...ghostBtn, flex: 1 }}>keep as journal</button>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(11,8,15,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 80 }
const sheet: React.CSSProperties = { background: '#fdfaff', width: '100%', maxWidth: 560, height: '92vh', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column' }
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '12px 18px', borderBottom: '.5px solid rgba(11,8,15,.06)' }
const closeBtn: React.CSSProperties = { border: 0, background: 'transparent', fontSize: 28, cursor: 'pointer', color: '#9e7a8c', lineHeight: 1 }
const body: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '24px 22px 40px' }
const lineStyle: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15, color: '#5e4c66', marginBottom: 8 }
const promptStyle: React.CSSProperties = { fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 22, color: '#0b080f', margin: '0 0 18px', lineHeight: 1.25 }
const choiceBtn: React.CSSProperties = { background: '#fff', border: `.5px solid ${ACCENT}33`, color: '#0b080f', borderRadius: 14, padding: '14px 16px', fontFamily: 'Sora,sans-serif', fontSize: 14, cursor: 'pointer', textAlign: 'left' }
const primaryBtn: React.CSSProperties = { background: ACCENT, color: '#fff', border: 0, borderRadius: 999, padding: '12px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
const ghostBtn: React.CSSProperties = { background: '#fff', color: ACCENT, border: `.5px solid ${ACCENT}55`, borderRadius: 999, padding: '12px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
const textInput: React.CSSProperties = { width: '100%', border: `.5px solid ${ACCENT}33`, borderRadius: 14, padding: 14, fontFamily: 'Inter,sans-serif', fontSize: 14, outline: 'none', resize: 'vertical' }
const slider: React.CSSProperties = { width: '100%', accentColor: ACCENT, margin: '14px 0' }
