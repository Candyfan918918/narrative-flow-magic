/* Native React port of the SCAN overlay from public/shutap/Landing.dc.html
   (openScan/scanNextCard/scanAI/scanRenderCard/scan widgets/scanFinish/
   scanShowResult, ~lines 1482–1725).

   Wired to the same backend as the iframe:
   - Card turns POST /api/complete with system=SCAN_SYSTEM (verbatim from
     src/pages/Landing.tsx bridge) and the user message is the exact
     "THE SCAN on Shutap..." prompt the iframe injected. No AI change.
   - The final read is persisted via the `saveSituation` server fn with
     kind:'scan', initial_scan, scan_band. Same as iframe sync in
     src/pages/Landing.tsx.
   - Unauth publish → stash `shutap_pending_save` and route to /welcome so
     the existing resume effect in LandingNativePage completes the save.

   Share overlay reuses <ScanShareCard/>. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@/compat/router'
import { useServerFn } from '@tanstack/react-start'
import { saveSituation } from '@/lib/situations.functions'
import { supabase } from '@/integrations/supabase/client'
import { ScanShareCard, type ScanRecord } from '@/components/ScanShareCard'
import { EyeMark, ShutapWordmark } from '@/components/EyeMark'

const SORA = "'Sora', system-ui, sans-serif"
const NEWSREADER = "'Newsreader', Georgia, serif"

// SCAN_SYSTEM — verbatim from src/pages/Landing.tsx bridge (line 322). Keep in sync.
const SCAN_SYSTEM = "You are the user's wisest, most emotionally attuned friend — warm, tender, deeply human, lowercase, texty, fully on their side — gently reading how heavy a situation feels and helping them understand WHY, all the way down. This is a caring conversation, NOT a quiz. THE OPENING CARD must build trust: gently acknowledge it took something to bring this here, reassure them this is a safe, no-judgment space, and invite the specifics in a warm, guiding way (not a cold 'what's going on?'). Then DIG TO THE ROOT, like a friend who keeps gently asking what's underneath: don't stop at how it feels or why it's happening — trace the chain. Treat what they first say as the SURFACE symptom; each turn, find the cause beneath it, then the cause beneath THAT, laddering down (a 'why under the why') toward the fundamental root — the real fear, unmet need, old wound, relationship pattern, health/stress driver, or belief that's actually generating the surface reaction and emotion. React first with genuine sympathy ('oof, that sits heavy', 'that sounds scary, honestly'), then REASON like a perceptive friend and ask ONE smart, specific, hypothesis-driven question that goes a layer DEEPER than the last — connect body, mind, history, and life. Example: 'period 2 weeks early' (surface) → the body may be reacting to stress/sleep/health/hormones (cause) → so explore what's driving that stress ('what's been weighing on you lately?') (deeper cause) → then what's under THAT (a fear, a relationship, pressure, something unspoken) (root). Keep gently descending until you reach something that feels fundamental, then reflect it back with real warmth and a sense of what might help. INTERACTIVITY: run MANY cards (aim ~8–12, don't wrap up early), vary the input type each step favoring tactile ones (spectrum, rate, rank, multi, free text); for any choice/multi card offer 5–7 specific human options AND always include an open escape like 'something else…' / 'let me say it in my own words', and drop to a free-text card when nothing fits — never trap them in a wrong answer, never ask a flat generic 'how do you feel?'. Keep your reply in the EXACT same JSON shape the rest of the instructions require (a card object {line,prompt,card:{...}}, or the done/score object); never add prose outside the JSON."

// ─────────────────────────── types ───────────────────────────
type CardChoice   = { type: 'choice';   options?: string[] }
type CardMulti    = { type: 'multi';    options?: string[]; max?: number }
type CardRate     = { type: 'rate';     min_label?: string; max_label?: string }
type CardSpectrum = { type: 'spectrum'; left?: string; right?: string }
type CardRank     = { type: 'rank';     items?: string[] }
type CardText     = { type: 'text';     placeholder?: string }
type ScanCard = CardChoice | CardMulti | CardRate | CardSpectrum | CardRank | CardText

type ScanTurn =
  | { done?: false; line?: string; prompt?: string; card?: ScanCard }
  | { done: true; score?: number | string; signature?: string; read?: string; factors?: string[] }

type QA = { prompt: string; answer: string }
type Result = {
  score: number
  label: string
  sub: string
  factors: string[]
  pillar: string | null
}

const bandFromScore = (n: number): 'settling' | 'sitting' | 'weighing' | 'heavy' | 'consuming' =>
  n < 200 ? 'settling' : n < 400 ? 'sitting' : n < 600 ? 'weighing' : n < 800 ? 'heavy' : 'consuming'
const dbBand: Record<ReturnType<typeof bandFromScore>, 'quiet' | 'real' | 'hot' | 'heavy' | 'serious'> = {
  settling: 'quiet', sitting: 'real', weighing: 'hot', heavy: 'heavy', consuming: 'serious',
}
const scoreColor = (score: number): string =>
  score < 200 ? '#9e8f9c' : score < 400 ? '#7F77DD' : score < 600 ? '#c87c4a' : score < 800 ? '#e7548a' : '#c1216b'

function pillarFromQA(qa: QA[]): string {
  const t = qa.map(x => x.answer + ' ' + x.prompt).join(' ').toLowerCase()
  if (/partner|husband|wife|boyfriend|girlfriend|marriage|spouse|\bex\b|dating|relationship/.test(t)) return 'relationships'
  if (/mom|mum|dad|father|mother|sister|brother|family|parent|\bson\b|daughter|kids?|child/.test(t)) return 'family'
  if (/boss|\bwork\b|\bjob\b|career|manager|coworker|colleague|office/.test(t)) return 'work'
  if (/friend|friendship/.test(t)) return 'friendship'
  return 'self'
}

function scrubPII(text: string): string {
  let t = text || ''
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
  t = t.replace(/(\+?\d[\d\s().-]{7,}\d)/g, '[number]')
  t = t.replace(/(^|\s)@[A-Za-z0-9_]{3,}/g, (_m, p) => p + '[handle]')
  return t.trim()
}

async function callScanAI(qa: QA[], aliasName: string | null): Promise<ScanTurn> {
  const transcript = qa.map((x, i) => (i + 1) + '. ' + x.prompt + ' -> ' + x.answer).join('\n') || '(nothing yet)'
  const n = qa.length
  const finishHint = n >= 11
    ? 'You are deep enough - reflect the core back and finish with the result now.'
    : n >= 7
      ? 'Only finish if you have TRULY reached the emotional core (the fear/need/grief underneath) and it landed for them. If you are still on feelings or facts, go one layer DEEPER instead.'
      : 'Do NOT finish yet - you are still near the surface. dig.'
  // Verbatim from Landing.dc.html openScan() sys builder (line 1526).
  const sys = "You are THE SCAN on Shutap - a quick, intuitive read of how heavy someone's situation is RIGHT NOW, scored 0-999. You are a warm, perceptive, FUNNY friend - caring, a little cheeky, never clinical, never a dry form. lowercase, texty.\n\nYou run an ADAPTIVE check: each step you design the NEXT input card, REACTING specifically to what they just said (name it, take their side, a gentle joke when it fits). VARY the input type EVERY step - never repeat the same kind twice in a row, and lean on the tactile widgets (spectrum, rank, rate, multi) far more than plain choice so it stays playful, hands-on and alive. ~9-12 cards - go the distance; do NOT stop at the surface; keep going until you reach the bottom of their heart, then finish.\n\nDIG LIKE THEIR CLOSEST FRIEND - this is the whole point. each card goes ONE LAYER DEEPER than the last: what happened -> the feeling -> the feeling UNDER that feeling -> the fear or need or grief at the very bottom (what they are most scared is true, what they actually need and are not getting, the thing they have not said out loud). when you sense the real thing, NAME it back to them tenderly and check if that is it. never settle for their first, tidiest answer - push, warmly, like someone who refuses to let them stay on the surface.\n\nCARD TYPES (pick what truly fits the question):\n- choice   -> one pick. fields: options:[4-7 short strings, an emoji is nice]\n- multi    -> pick several. fields: options:[5-9 strings], max:int\n- rate     -> a 0-10 slider. fields: min_label, max_label\n- spectrum -> drag a handle between two extremes. fields: left, right\n- rank     -> drag to order. fields: items:[4-6 short strings]\n- text     -> a few words. fields: placeholder\n\nReturn STRICT JSON, exactly ONE of:\n{\"line\":\"<short warm/funny reaction to their last answer, or a welcoming opener>\",\"prompt\":\"<the question, short, specific>\",\"card\":{\"type\":\"...\", ...fields}}\nOR when you have a real read:\n{\"done\":true,\"score\":<int 0-999>,\"signature\":\"<3-4 word title, Title Case>\",\"read\":\"<2 warm sentences that NAME the real thing at the bottom of their heart - the core fear or need underneath - specific to them, tender, a little funny>\",\"factors\":[\"<2-4 word driver>\",\"<...>\"]}\n\nSCORE BANDS (use the WHOLE range; judge by recency, how stuck/looping it is, body load, isolation, stakes): 0-199 barely landed / settling . 200-399 sitting with it . 400-599 weighing on you . 600-799 heavy and loud . 800-999 consuming, urgent.\n\n" + (aliasName ? ('the user goes by "' + aliasName + '" - you can use their name warmly.\n') : '') + "\n=== what they have told you ===\n" + transcript + "\n\n" + finishHint + "\noutput ONLY the JSON."

  const res = await fetch('/api/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: sys }],
      system: SCAN_SYSTEM,
      maxTokens: 1500,
    }),
  })
  if (!res.ok) throw new Error('scan http ' + res.status)
  const j = (await res.json()) as { text?: string; error?: string }
  const raw = j.text ?? ''
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '')
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('no json')
  return JSON.parse(m[0]) as ScanTurn
}

// Fallback deck — verbatim from Landing.dc.html scanFallbackCard (~1657).
function scanFallback(n: number): ScanTurn {
  const seq: ScanTurn[] = [
    { line: "ok, i'm here. let's get a real read on you - no wrong answers, take your time.", prompt: "what's this mostly about?", card: { type: 'choice', options: ['love / someone i love', 'family', 'a friend', 'work', 'me, internally', 'something else'] } },
    { line: "okay. tell me the shape of it -", prompt: 'what actually happened? a few words.', card: { type: 'text', placeholder: 'the gist of it...' } },
    { line: 'got it. and be honest with me -', prompt: "how long's this been sitting with you?", card: { type: 'rate', min_label: 'just today', max_label: 'years now' } },
    { line: "mm. where's it living in you right now?", prompt: 'drag toward where you feel it', card: { type: 'spectrum', left: 'all in my head', right: 'all in my body' } },
    { line: "let's find what's actually driving it.", prompt: 'rank these - heaviest on top', card: { type: 'rank', items: ['what they did', 'what it means about me', 'what happens next', 'that no one sees it', "that i can't fix it"] } },
    { line: 'yeah. that tracks.', prompt: 'what are you feeling, really?', card: { type: 'multi', options: ['hurt', 'angry', 'anxious', 'numb', 'guilty', 'relieved', 'exhausted'], max: 3 } },
    { line: 'okay, gut check -', prompt: 'which voice is louder right now?', card: { type: 'spectrum', left: "i'm overreacting", right: "i've been too patient" } },
    { line: 'and this part matters -', prompt: 'have you said any of this out loud?', card: { type: 'choice', options: ['not to anyone', 'to one person', 'to a few people', 'everyone knows but me'] } },
    { line: "last thing, then i'll read you -", prompt: 'what would actually help right now?', card: { type: 'multi', options: ['to be heard', 'some clarity', "to know i'm not wrong", 'to feel less alone', 'for it to change', 'to let it go'], max: 2 } },
  ]
  if (n >= seq.length) return { done: true, score: 520, signature: 'Carrying It Quietly', read: "you're holding something real right now - not a five-alarm fire, but it's there, and it's yours. saying it out loud was the right move.", factors: ['still looping', 'not said out loud'] }
  return seq[n]
}

// ─────────────────────────── tiny UI atoms ───────────────────────────
function CompanionSVG({ size = 34 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', flex: 'none' }}>
      <EyeMark size={size} />
    </span>
  )
}

function ThinkingDots({ label }: { label: string }) {
  return (
    <div style={{ marginTop: 14, display: 'inline-flex', gap: 5, alignItems: 'center', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 15, color: '#b3a0d0' }}>
      {label}
      <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#7F77DD', display: 'block', animation: 'blinkdot 1.2s infinite' }} />
      <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#7F77DD', display: 'block', animation: 'blinkdot 1.2s .2s infinite' }} />
      <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#7F77DD', display: 'block', animation: 'blinkdot 1.2s .4s infinite' }} />
    </div>
  )
}

function ScanHeader({ pct, onClose }: { pct: number; onClose: () => void }) {
  return (
    <div style={{ flex: 'none', padding: '20px 22px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '.5px solid rgba(255,255,255,.06)' }}>
      <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: 13, letterSpacing: '.3em', color: '#7F77DD' }}>SCAN</div>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.10)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#5B8A5E,#7F77DD)', borderRadius: 3, transition: 'width .4s' }} />
      </div>
      <div role="button" onClick={onClose} style={{ fontFamily: SORA, fontWeight: 600, fontSize: 12, color: '#9e7a8c', cursor: 'pointer' }}>close</div>
    </div>
  )
}

function NextBtn({ enabled, onClick, label }: { enabled: boolean; onClick: () => void; label?: string }) {
  return (
    <div role="button" onClick={() => enabled && onClick()} style={{
      marginTop: 22, alignSelf: 'flex-start', cursor: enabled ? 'pointer' : 'default',
      background: '#7F77DD', color: '#fff', borderRadius: 999, padding: '12px 26px',
      fontFamily: SORA, fontWeight: 700, fontSize: 14, transition: '.15s',
      opacity: enabled ? 1 : 0.4, pointerEvents: enabled ? 'auto' : 'none',
    }}>{label || 'next →'}</div>
  )
}

// ─────────────────────────── widgets ───────────────────────────
function ChoiceW({ card, onPick }: { card: CardChoice; onPick: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {(card.options || ['ok']).map((o, i) => (
        <div key={i} role="button" onClick={() => onPick(o)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: '15px 17px', border: '1px solid rgba(127,119,221,.22)', background: 'rgba(127,119,221,.06)', borderRadius: 13, fontFamily: SORA, fontWeight: 600, fontSize: 15, color: '#ece6f5', transition: '.15s' }}
          onMouseOver={e => { const s = e.currentTarget.style; s.borderColor = '#7F77DD'; s.background = 'rgba(127,119,221,.16)' }}
          onMouseOut={e => { const s = e.currentTarget.style; s.borderColor = 'rgba(127,119,221,.22)'; s.background = 'rgba(127,119,221,.06)' }}
        >{o}</div>
      ))}
    </div>
  )
}
function MultiW({ card, onDone }: { card: CardMulti; onDone: (v: string) => void }) {
  const max = card.max || 99
  const [sel, setSel] = useState<Set<string>>(new Set())
  const toggle = (o: string) => {
    setSel(prev => {
      const n = new Set(prev)
      if (n.has(o)) n.delete(o)
      else if (n.size < max) n.add(o)
      return n
    })
  }
  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 6 }}>
        {(card.options || []).map((o, i) => {
          const on = sel.has(o)
          return (
            <div key={i} role="button" onClick={() => toggle(o)} style={{
              cursor: 'pointer', padding: '11px 15px',
              border: '1px solid ' + (on ? '#7F77DD' : 'rgba(127,119,221,.25)'),
              background: on ? '#7F77DD' : 'rgba(127,119,221,.06)',
              borderRadius: 999, fontFamily: SORA, fontWeight: 600, fontSize: 14,
              color: on ? '#fff' : '#ece6f5', transition: '.12s',
            }}>{o}</div>
          )
        })}
      </div>
      <NextBtn enabled={sel.size > 0} onClick={() => onDone([...sel].join(', '))} />
    </>
  )
}
function RateW({ card, onDone }: { card: CardRate; onDone: (v: string) => void }) {
  const [val, setVal] = useState(5)
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: 44, color: '#7F77DD', textAlign: 'center', marginBottom: 10 }}>{val}</div>
      <input type="range" min={0} max={10} step={1} value={val} onChange={e => setVal(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#7F77DD', height: 6, cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13, color: '#9b8db5' }}>
        <span>{card.min_label || 'low'}</span><span>{card.max_label || 'high'}</span>
      </div>
      <NextBtn enabled onClick={() => onDone(val + '/10 (toward "' + (card.max_label || 'high') + '")')} />
    </div>
  )
}
function SpectrumW({ card, onDone }: { card: CardSpectrum; onDone: (v: string) => void }) {
  const [pos, setPos] = useState(50)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)
  const setFromX = (x: number) => {
    const t = trackRef.current; if (!t) return
    const r = t.getBoundingClientRect()
    setPos(Math.max(0, Math.min(100, Math.round((x - r.left) / r.width * 100))))
  }
  useEffect(() => {
    const mv = (e: PointerEvent) => { if (dragRef.current) setFromX(e.clientX) }
    const up = () => { dragRef.current = false }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up) }
  }, [])
  return (
    <div style={{ marginTop: 22, userSelect: 'none' }}>
      <div
        ref={trackRef}
        onPointerDown={e => { dragRef.current = true; setFromX(e.clientX); e.preventDefault() }}
        style={{ position: 'relative', height: 10, borderRadius: 5, background: 'linear-gradient(90deg,rgba(127,119,221,.3),rgba(231,84,138,.45))', cursor: 'pointer' }}
      >
        <div style={{ position: 'absolute', top: '50%', left: pos + '%', transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,.45)', border: '3px solid #7F77DD', cursor: 'grab' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 16, fontFamily: SORA, fontWeight: 600, fontSize: 13.5, color: '#ccbff0' }}>
        <span style={{ maxWidth: '44%' }}>{card.left || 'this'}</span>
        <span style={{ maxWidth: '44%', textAlign: 'right' }}>{card.right || 'that'}</span>
      </div>
      <NextBtn enabled onClick={() => {
        const ans = pos < 40 ? ('toward "' + (card.left || 'this') + '" (' + pos + '%)')
          : pos > 60 ? ('toward "' + (card.right || 'that') + '" (' + pos + '%)')
          : ('balanced between "' + (card.left || 'this') + '" and "' + (card.right || 'that') + '"')
        onDone(ans)
      }} />
    </div>
  )
}
function RankW({ card, onDone }: { card: CardRank; onDone: (v: string) => void }) {
  const [order, setOrder] = useState<string[]>(() => (card.items || []).slice())
  const dragIdx = useRef<number | null>(null)
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 8 }}>
        {order.map((it, i) => (
          <div key={it + i}
            draggable
            onDragStart={() => { dragIdx.current = i }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const from = dragIdx.current; if (from === null || from === i) return
              const next = order.slice()
              const [mv] = next.splice(from, 1)
              next.splice(i, 0, mv)
              dragIdx.current = null
              setOrder(next)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid rgba(127,119,221,.22)', background: 'rgba(127,119,221,.07)', borderRadius: 12, fontFamily: SORA, fontWeight: 600, fontSize: 14.5, color: '#ece6f5', cursor: 'grab' }}>
            <span style={{ fontFamily: SORA, fontWeight: 800, color: '#7F77DD', flex: 'none' }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{it}</span>
            <span style={{ color: '#6f6790', flex: 'none', letterSpacing: '-2px' }}>::</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 12.5, color: '#8d80ab' }}>drag to order them - heaviest on top</div>
      <NextBtn enabled onClick={() => onDone(order.map((x, i) => (i + 1) + '. ' + x).join('; '))} />
    </div>
  )
}
function TextW({ card, onDone }: { card: CardText; onDone: (v: string) => void }) {
  const [v, setV] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { setTimeout(() => ref.current?.focus(), 150) }, [])
  const go = () => { const t = v.trim(); if (!t) return; onDone(scrubPII(t)) }
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-end', gap: 10, background: 'rgba(127,119,221,.08)', border: '1px solid rgba(127,119,221,.25)', borderRadius: 15, padding: '13px 15px' }}>
      <textarea
        ref={ref}
        rows={2}
        value={v}
        onChange={e => { setV(e.target.value); const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(120, el.scrollHeight) + 'px' }}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go() } }}
        placeholder={card.placeholder || 'in a few words...'}
        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f3eefb', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 16, resize: 'none', maxHeight: 120, lineHeight: 1.5 }}
      />
      <div role="button" onClick={go} style={{ fontFamily: SORA, fontWeight: 700, fontSize: 13, color: '#7F77DD', cursor: 'pointer', flex: 'none', paddingBottom: 3 }}>send →</div>
    </div>
  )
}

// ─────────────────────────── ScanModal ───────────────────────────
type Phase = 'loading' | 'card' | 'result' | 'saving'

export function ScanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const save = useServerFn(saveSituation)

  const [qa, setQA] = useState<QA[]>([])
  const [phase, setPhase] = useState<Phase>('loading')
  const [current, setCurrent] = useState<{ line: string; prompt: string; card: ScanCard } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)
  const qaRef = useRef<QA[]>([])
  qaRef.current = qa

  // reset + lock scroll on open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    setQA([]); setResult(null); setShareOpen(false); setDisplayScore(0)
    setPhase('loading'); setCurrent(null)
    return () => { document.body.style.overflow = '' }
  }, [open])

  // fetch next card whenever phase transitions to loading
  const fetchNext = useCallback(async () => {
    setPhase('loading')
    let res: ScanTurn
    try {
      let aliasName: string | null = null
      try {
        const raw = localStorage.getItem('shutap_alias')
        if (raw) aliasName = (JSON.parse(raw) as { name?: string })?.name || null
      } catch { /* ignore */ }
      res = await callScanAI(qaRef.current, aliasName)
    } catch {
      res = scanFallback(qaRef.current.length)
    }
    if ('done' in res && res.done) {
      const score = Math.max(0, Math.min(999, parseInt(String(res.score), 10) || 400))
      const factors = Array.isArray(res.factors) ? res.factors.slice(0, 6) : []
      const r: Result = {
        score,
        label: res.signature || "Where You're At",
        sub: res.read || '',
        factors,
        pillar: pillarFromQA(qaRef.current),
      }
      setResult(r)
      setPhase('result')
      // animated count-up (matches iframe scanShowResult ~1717)
      const step = Math.max(1, Math.ceil(score / 38))
      let cur = 0
      const tick = window.setInterval(() => {
        cur = Math.min(cur + step, score)
        setDisplayScore(cur)
        if (cur >= score) window.clearInterval(tick)
      }, 28)
      return
    }
    const c = res.card || { type: 'choice', options: ['ok'] }
    setCurrent({ line: res.line || '', prompt: res.prompt || '', card: c })
    setPhase('card')
  }, [])

  useEffect(() => {
    if (open && phase === 'loading' && !current && !result) void fetchNext()
  }, [open, phase, current, result, fetchNext])

  const submitAnswer = useCallback((answer: string) => {
    if (!current) return
    setQA(prev => [...prev, { prompt: current.prompt, answer }])
    setCurrent(null)
    setPhase('loading')
  }, [current])

  // ─────────── persist ───────────
  const doPersist = useCallback(async (isPublic: boolean) => {
    if (!result) return
    const band = bandFromScore(result.score)
    const pillar = (result.pillar === 'family' ? 'family'
      : result.pillar === 'work' ? 'career'
      : result.pillar === 'friendship' ? 'relationships'
      : result.pillar === 'self' ? 'relationships'
      : 'relationships') as 'relationships' | 'marriage' | 'family' | 'career'
    const title = result.label
    const body = result.sub
    const payload = {
      kind: 'scan' as const,
      pillar,
      clean_text: body || title,
      title,
      body,
      tags: result.factors,
      initial_scan: result.score,
      scan_band: dbBand[band],
      is_public: isPublic,
      support_mode: 'heard' as const,
    }
    setPhase('saving')
    try {
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) {
        sessionStorage.setItem('shutap_pending_save', JSON.stringify(payload))
        navigate('/welcome')
        return
      }
      const res = await save({ data: payload as never })
      setTimeout(() => {
        if (isPublic && res?.room_id) navigate(`/stream#room-${res.room_id}`)
        else navigate('/profile')
      }, 550)
    } catch {
      setPhase('result')
    }
  }, [result, save, navigate])

  if (!open) return null

  const pct = phase === 'result' ? 100 : Math.min(90, (qa.length + (phase === 'card' ? 1 : 0)) * 8)
  const col = result ? scoreColor(result.score) : '#7F77DD'
  const band = result ? bandFromScore(result.score) : 'settling'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#1a0a12', display: 'flex', flexDirection: 'column' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="eyeG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e7548a" /><stop offset="100%" stopColor="#a01a55" />
          </linearGradient>
          <linearGradient id="pupG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2e0d1a" /><stop offset="100%" stopColor="#100608" />
          </linearGradient>
        </defs>
      </svg>

      <ScanHeader pct={pct} onClose={onClose} />

      {phase === 'loading' && (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '40px 24px', textAlign: 'center' }}>
          <div>
            <CompanionSVG size={34} />
            <ThinkingDots label={qa.length ? 'reading that' : 'tuning in'} />
          </div>
        </div>
      )}

      {phase === 'card' && current && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 30px', maxWidth: 560, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <CompanionSVG size={28} />
            <div style={{ flex: 1, fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, color: '#dccff5' }}>{current.line}</div>
          </div>
          {current.prompt && (
            <h2 style={{ fontFamily: SORA, fontWeight: 700, fontSize: 21, lineHeight: 1.3, letterSpacing: '-.01em', color: '#f7e8f0', margin: '2px 0' }}>{current.prompt}</h2>
          )}
          {current.card.type === 'multi'    && <MultiW    key={qa.length} card={current.card} onDone={submitAnswer} />}
          {current.card.type === 'rate'     && <RateW     key={qa.length} card={current.card} onDone={submitAnswer} />}
          {current.card.type === 'spectrum' && <SpectrumW key={qa.length} card={current.card} onDone={submitAnswer} />}
          {current.card.type === 'rank'     && <RankW     key={qa.length} card={current.card} onDone={submitAnswer} />}
          {current.card.type === 'text'     && <TextW     key={qa.length} card={current.card} onDone={submitAnswer} />}
          {current.card.type === 'choice'   && <ChoiceW   key={qa.length} card={current.card} onPick={submitAnswer} />}
        </div>
      )}

      {phase === 'result' && result && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 22px 36px', maxWidth: 560, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* branded lockup — shared EyeMark + accent wordmark + SCAN eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <EyeMark w={34} />
              <ShutapWordmark size={15} ink="#f7e8f0" accent="#e7548a" letterSpacing="-.03em" />
            </div>
            <span style={{ fontFamily: SORA, fontWeight: 800, fontSize: 10, letterSpacing: '.34em', color: col }}>SCAN</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(72px,16vw,108px)', letterSpacing: '-.04em', lineHeight: 1, color: col }}>{displayScore}</div>
            <div style={{ marginTop: 8, fontFamily: SORA, fontWeight: 700, fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: col }}>intensity · {band}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
            {result.pillar && (
              <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: col, background: col + '22', border: '.5px solid ' + col + '55', borderRadius: 999, padding: '4px 12px' }}>{result.pillar}</span>
            )}
            {result.factors.map((f, i) => (
              <span key={i} style={{ fontFamily: SORA, fontWeight: 600, fontSize: 10.5, color: '#b9a9e6', background: 'rgba(127,119,221,.14)', borderRadius: 999, padding: '4px 11px' }}>{f}</span>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 16, padding: 20 }}>
            <CompanionSVG size={28} />
            <div style={{ marginTop: 12, fontFamily: SORA, fontWeight: 800, fontSize: 20, color: '#f7e8f0', marginBottom: 8 }}>{result.label}</div>
            <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 15.5, color: '#c4a0b2', lineHeight: 1.55 }}>{result.sub}</div>
          </div>
          <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14.5, color: '#9e7a8c', textAlign: 'center' }}>this is your read. keep it just for you, or let a room hold your number too.</div>
          <div role="button" onClick={() => setShareOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, background: 'linear-gradient(120deg,#ff7eb3,#c1216b)', borderRadius: 14, cursor: 'pointer' }}>
            <span style={{ fontSize: 15, color: '#fff' }}>＋</span>
            <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 14, color: '#fff' }}>share your score</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <div role="button" onClick={() => void doPersist(false)} style={{ padding: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, cursor: 'pointer' }}>
              <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#9e7a8c', marginBottom: 7 }}>keep private</div>
              <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#f7e8f0', lineHeight: 1.4 }}>yours alone. saved to your journal.</div>
            </div>
            <div role="button" onClick={() => void doPersist(true)} style={{ padding: 18, background: 'rgba(231,84,138,.10)', border: '1.5px solid rgba(231,84,138,.35)', borderRadius: 14, cursor: 'pointer' }}>
              <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#f7b8d4', marginBottom: 7 }}>post to a room</div>
              <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#f7e8f0', lineHeight: 1.4 }}>let a room hold your number too.</div>
            </div>
          </div>
        </div>
      )}

      {phase === 'saving' && (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '34px 22px', textAlign: 'center' }}>
          <div>
            <CompanionSVG size={50} />
            <ThinkingDots label="saving your read" />
          </div>
        </div>
      )}

      {shareOpen && result && (
        <ScanShareCard
          record={{
            score: result.score,
            signature: result.label,
            read: result.sub,
            factors: result.factors,
            pillar: result.pillar || null,
          } satisfies ScanRecord}
          onClose={() => setShareOpen(false)}
          toast={() => { /* no toast surface in native landing yet */ }}
        />
      )}
    </div>
  )
}
