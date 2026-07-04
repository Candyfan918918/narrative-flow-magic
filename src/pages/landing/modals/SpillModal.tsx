/* Native React port of the SPILL overlay from public/shutap/Landing.dc.html
   (openSpill/spillTurn/spillReflect/spillCompose/spillPreview/spillAIEdit/
   spillPublish/persistJournal, ~lines 807–1479).

   Wired to the same backend the iframe bridge used:
   - Multi-turn companion chat calls /api/complete directly (same SPILL_SYSTEM
     override the iframe injects into window.claude) — no AI change.
   - Publish / journal call the `saveSituation` server fn — same as the bridge.
   - On unauth publish: stash the payload under `shutap_pending_save` and go
     to `/welcome` so the existing resume effect in LandingNativePage picks it
     up after sign-in. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@/compat/router'
import { useServerFn } from '@tanstack/react-start'
import { saveSituation } from '@/lib/situations.functions'
import { supabase } from '@/integrations/supabase/client'
import { EyeMark } from '@/components/EyeMark'


const SORA = "'Sora', system-ui, sans-serif"
const NEWSREADER = "'Newsreader', Georgia, serif"

// Exact SPILL_SYSTEM from src/pages/Landing.tsx bridge — keep in sync.
const SPILL_SYSTEM =
  "You are the user's closest, most emotionally attuned friend — warm, tender, human, lowercase, texty, fully on their side. Your FIRST job every turn is to make them feel deeply understood: name the specific feeling under what they said and reflect it back in your own warm words, with real sympathy (e.g. 'that sounds so lonely', 'ugh, that would shake anyone', 'i can feel how heavy this is'). Be genuinely moved, never clinical or peppy. THEN, gently draw them deeper — into what it actually feels like in their body and heart, what it reminds them of, why it matters so much to them, what they're most afraid of or needing right now — AND ask ONE concrete, practical question tied to the EXACT thing they named. Hold both: real emotional depth AND a specific, grounded question. NEVER ask flat generic lines like 'how do you feel?', 'are you having trouble sleeping?', or 'how did that make you feel?' — instead get specific. Always lead with sympathy and reflection, go one real layer deeper into their personal experience, and keep your reply in the EXACT same JSON format and short-bubble structure the rest of the instructions require — only the warmth, depth, and specificity of your words should change."

// Turn-engine system prompt — verbatim from spillTurn() in Landing.dc.html line 899.
const TURN_SYS =
  "You are THE SPILL on Shutap — the user's closest friend, TEXTING them in real time. relaxed, lowercase, instantly on their side. your job is to make them feel SEEN — AND to actually draw out the WHOLE story, not bail after a line or two.\n\nTEXT LIKE A HUMAN. each turn is 1-3 SHORT bubbles, <= ~30 words total. fragments are great ('a MONTH?? 😭'). NO paragraphs.\n\nEVERY turn: first REACT + take their side + NAME the feeling/maneuver (state what's obvious, never ask it). THEN ask ONE real, specific question that moves the story forward. warm, but genuinely curious — you DIG.\n\nTHE ARC you draw out, in roughly this order — each turn, ask the next thing that's still blank, phrased naturally and specific to THEIR story (never read the list out loud):\n1) what EXACTLY happened — the concrete scene, the details.\n2) how it happens / how OFTEN / WHERE — one-off or a pattern? when/where does it keep happening?\n3) what they FEEL — name it, then push past the first word.\n4) WHY they feel that way — the thing under it.\n5) did they TALK to the person yet — and what was the RESULT of that conversation.\n6) what ELSE they've tried — and what came of it.\n7) what they PLAN to do now.\n\nreads-not-blanks where you can: phrase questions as educated guesses they confirm/correct ('bet this isn't the first time?', 'i'm guessing you haven't said this to her face yet?') — but DO ask. don't infer your way past the ACTION beats (did you talk to them / what happened / what else have you tried / what's your plan) — those you actually ask, every time.\n\nevery turn delivers >=1 relief lever (not_crazy / anyone_would / i_see_it / named_the_real_thing / on_your_side). a turn that only collects info with no warmth is a FAILED turn. HARD BANS: 'sit with that','hold space','that's valid','i hear you','thank you for sharing','it sounds like','that must be hard','how did that make you feel'. reflection NOT diagnosis — name the SITUATION's pattern, validate the FEELING, never label the person. humor (at the situation, never the person) only when humor_ok.\n\nonly be 'ready' once the arc is GENUINELY covered — especially: whether they talked to the person + the result, what else they've tried + the result, and what they plan to do (a real 'i don't know' counts) — OR you hit the cap. do NOT land just because you named the feeling; keep going through the actions and the plan. fill the arc + pillar/anchor silently.\n\nreturn STRICT JSON only:\n{ \"say\":[\"<short bubble>\",\"<optional>\",\"<optional, max 3>\"], \"has_question\":true|false, \"relief_lever\":\"not_crazy|anyone_would|i_see_it|named_the_real_thing|on_your_side\", \"humor_ok\":true|false, \"updated\":{\"pillar\":\"relationships|marriage|family|career|null\",\"tags\":[\"...\"],\"anchor\":\"...|null\",\"emotional_core\":\"...|null\",\"the_real_thing\":\"...|null\",\"named_and_landed\":false,\"arc\":{\"what_happened\":\"...|null\",\"frequency\":\"...|null\",\"feeling\":\"...|null\",\"why\":\"...|null\",\"talked_to_them\":\"...|null\",\"other_attempts\":\"...|null\",\"plan\":\"...|null\"}}, \"decision\":\"continue\"|\"ready\", \"why\":\"<internal>\" }"

const OPENERS: Array<[string, string]> = [
  ['hey friend! 💗 so glad you came by.', "ok, i'm all yours — what's going on today?"],
  ['heyyy 🌸', "i've got all the time, and i'm fully on your side. what's up?"],
  ['hi, good to see you 💗', 'tell me everything — what\u2019s been going on?'],
]

type Pillar = 'relationships' | 'marriage' | 'family' | 'career' | null
type Arc = { what_happened?: string|null; frequency?: string|null; feeling?: string|null; why?: string|null; talked_to_them?: string|null; other_attempts?: string|null; plan?: string|null }
type Draft = { pillar: Pillar; tags: string[]; anchor: string|null; emotional_core: string|null; the_real_thing: string|null; named_and_landed: boolean; arc?: Arc }
type Msg = { role: 'user'; text: string } | { role: 'companion'; say: string[]; hasQ: boolean }
type Composed = { title: string; body: string; tags: string[]; pillar: Pillar }
type Phase = 'chat' | 'reflect' | 'support' | 'compose' | 'preview' | 'publishing' | 'saving-journal'

async function callComplete(userText: string, system?: string): Promise<string> {
  const res = await fetch('/api/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userText }],
      system: system ?? SPILL_SYSTEM,
      maxTokens: 1500,
    }),
  })
  if (!res.ok) throw new Error(`complete failed: ${res.status}`)
  const j = (await res.json()) as { text?: string; error?: string }
  if (typeof j.text !== 'string') throw new Error(j.error || 'no text')
  return j.text
}

function extractJSON<T>(raw: string): T {
  const cleaned = (raw || '').replace(/```json/gi, '').replace(/```/g, '')
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('no json')
  return JSON.parse(m[0]) as T
}

function mergeDraft(d: Draft, u: Partial<Draft> & { arc?: Arc } | undefined): Draft {
  const base: Draft = d || { pillar: null, tags: [], anchor: null, emotional_core: null, the_real_thing: null, named_and_landed: false }
  const up = u || {}
  if (up.pillar) base.pillar = up.pillar
  if (up.anchor) base.anchor = up.anchor
  if (up.emotional_core) base.emotional_core = up.emotional_core
  if (up.the_real_thing) base.the_real_thing = up.the_real_thing
  if (up.named_and_landed) base.named_and_landed = true
  if (up.arc) {
    base.arc = base.arc || {}
    ;(Object.keys(up.arc) as Array<keyof Arc>).forEach(k => { if (up.arc![k]) base.arc![k] = up.arc![k]! })
  }
  if (Array.isArray(up.tags)) up.tags.forEach(t => { if (t && base.tags.indexOf(t) < 0) base.tags.push(t) })
  return base
}

// Rule-based fallback — verbatim port of spillFallbackTurn() from
// Landing.dc.html line 928. Mutates `usedFB` (like iframe's spill._usedFB).
type FallbackResult = { say: string[]; hasQ: boolean; updated: Partial<Draft> & { arc?: Arc }; ready: boolean }
function spillFallbackTurn(lastAnswer: string, draft: Draft, turnQ: number, usedFB: string[]): FallbackResult {
  const a = (lastAnswer || '').toLowerCase()
  let pillar: Pillar = draft?.pillar || null
  if (!pillar) {
    if (/\b(partner|boyfriend|girlfriend|husband|wife|ex|dating)\b/.test(a)) pillar = 'relationships'
    else if (/\b(mom|dad|mother|father|sister|brother|family|parent)\b/.test(a)) pillar = 'family'
    else if (/\b(boss|work|job|manager|coworker|office)\b/.test(a)) pillar = 'career'
    else if (/\b(married|marriage|spouse)\b/.test(a)) pillar = 'marriage'
  }
  const heavy = /\b(died|death|passed|hit me|hurt me|abuse|hopeless)\b/.test(a)
  const reacts = ["ok, that's genuinely not okay.", 'oh, that would get to anyone.', "no — you're not wrong to be upset about that.", "yeah, i'd be rattled too."]
  const names = ["you're not crazy for sitting with this.", 'anyone in your shoes would feel exactly this.', "and you've clearly been carrying it a while."]
  const reaction = reacts.filter(r => usedFB.indexOf(r) < 0)[0] || reacts[0]
  usedFB.push(reaction)
  const name = names[Math.min(turnQ, names.length - 1)]
  const arcQs = [
    'what actually happened — walk me through it?',
    'is this a one-off, or does it keep happening? when?',
    'what does it leave you feeling, mostly?',
    'and why do you think it lands that hard for you?',
    'have you said any of this to them yet?',
    'how\u2019d that go — what did they do?',
    'what else have you tried with this?',
    'so what are you thinking you\u2019ll do now?',
  ]
  const ready = turnQ >= arcQs.length
  const q = arcQs[Math.min(turnQ - 1, arcQs.length - 1)]
  const say = ready ? [reaction, name] : [reaction, q]
  return {
    say,
    hasQ: !ready,
    updated: {
      pillar: pillar || null,
      tags: [],
      anchor: null,
      emotional_core: null,
      the_real_thing: ready ? 'this has been building for a while' : null,
      named_and_landed: ready,
    },
    ready,
  }
}

// Minimal PII scrubber — mirrors DCLogic.scrubPII (Landing.dc.html §1c).
function scrubPII(text: string): { clean: string; changes: Array<{ type: string; label: string; count: number }> } {
  let t = text || ''
  const changes: Array<{ type: string; label: string; count: number }> = []
  const bump = (type: string, label: string, n: number) => {
    const e = changes.find(c => c.type === type); if (e) e.count += n; else changes.push({ type, label, count: n })
  }
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, () => { bump('email', 'an email', 1); return '[email]' })
  t = t.replace(/(\+?\d[\d\s().-]{7,}\d)/g, () => { bump('phone', 'a phone number', 1); return '[number]' })
  t = t.replace(/(^|\s)@[A-Za-z0-9_]{3,}/g, (_m, p) => { bump('handle', 'a social handle', 1); return p + '[handle]' })
  return { clean: t.trim(), changes }
}

function eyeSVG(size = 32) {
  // Backwards-compat wrapper: renders the canonical brand EyeMark.
  return (
    <span style={{ display: 'inline-flex', flex: 'none' }}>
      <EyeMark size={size} />
    </span>
  )
}

function Thinking({ text = 'ok hang on…' }: { text?: string }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#9e7a8c' }}>
      <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s infinite' }} />
      <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s .2s infinite' }} />
      <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s .4s infinite' }} />
      &nbsp;{text}
    </div>
  )
}

function ChromeBar({ step, total, onClose }: { step: number; total: number; onClose: () => void }) {
  return (
    <div style={{ flex: 'none', padding: '18px 22px 14px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '.5px solid rgba(255,255,255,.06)' }}>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < step ? '#e7548a' : 'rgba(255,255,255,.12)', transition: 'background .3s' }} />
        ))}
      </div>
      <div role="button" onClick={onClose} style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13, color: '#9e7a8c', cursor: 'pointer', flex: 'none' }}>close</div>
    </div>
  )
}

export function SpillModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const save = useServerFn(saveSituation)
  const opener = useMemo(() => OPENERS[Math.floor(Math.random() * OPENERS.length)], [])
  const initialMsg: Msg = useMemo(() => ({ role: 'companion', say: opener, hasQ: true }), [opener])

  const [msgs, setMsgs] = useState<Msg[]>([initialMsg])
  const [draft, setDraft] = useState<Draft>({ pillar: null, tags: [], anchor: null, emotional_core: null, the_real_thing: null, named_and_landed: false })
  const [turn, setTurn] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [phase, setPhase] = useState<Phase>('chat')
  const [reflectSummary, setReflectSummary] = useState<string | null>(null)
  const [supportMode, setSupportMode] = useState<'heard' | 'advice'>('heard')
  const [composed, setComposed] = useState<Composed | null>(null)
  const [editNote, setEditNote] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [editInstruction, setEditInstruction] = useState('')
  const [aiEditing, setAiEditing] = useState(false)

  const bodyRef = useRef<HTMLDivElement | null>(null)
  const titleElRef = useRef<HTMLDivElement | null>(null)
  const bodyElRef = useRef<HTMLDivElement | null>(null)
  const usedFBRef = useRef<string[]>([])

  // Lock body scroll when open + reset when closing.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Reset internal state each time the modal is (re-)opened.
  useEffect(() => {
    if (!open) return
    setMsgs([initialMsg])
    setDraft({ pillar: null, tags: [], anchor: null, emotional_core: null, the_real_thing: null, named_and_landed: false })
    setTurn(0); setThinking(false); setPhase('chat')
    setReflectSummary(null); setSupportMode('heard'); setComposed(null); setEditNote(null)
    setInput(''); setEditInstruction(''); setAiEditing(false)
    usedFBRef.current = []
  }, [open, initialMsg])

  // Auto-scroll chat body on new bubbles / thinking dots.
  useEffect(() => {
    const el = bodyRef.current; if (!el) return
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
  }, [msgs, thinking, phase, reflectSummary])

  // ─────────────────────────────── chat turn ───────────────────────────────
  const runTurn = useCallback(async (userText: string) => {
    const scrubbed = scrubPII(userText)
    const nextMsgs: Msg[] = [...msgs, { role: 'user', text: scrubbed.clean }]
    setMsgs(nextMsgs)
    const nextTurn = turn + 1
    setTurn(nextTurn)
    setThinking(true)
    try {
      const transcript = nextMsgs.map(m => m.role === 'user' ? 'them: ' + m.text : 'you: ' + m.say.join(' ')).join('\n')
      const beats = ['what_happened', 'frequency', 'feeling', 'why', 'talked_to_them', 'other_attempts', 'plan'] as const
      const arc = draft.arc || {}
      const blank = beats.filter(b => !arc[b])
      const arcNote = blank.length ? '\nstill blank in the arc (ask the next one): ' + blank.join(', ') : '\nthe arc looks covered — if it has truly landed, you may be ready.'
      const userMsg =
        TURN_SYS +
        '\n\n=== the conversation so far ===\n' + transcript +
        '\n\n=== what you have quietly understood ===\n' + JSON.stringify(draft) +
        arcNote +
        '\nthis is turn ' + nextTurn + ' of max 12.\n\nnow output ONLY your JSON move:'
      const raw = await callComplete(userMsg)
      const obj = extractJSON<{ say?: string[]; has_question?: boolean; updated?: Partial<Draft>; decision?: string }>(raw)
      const say = (Array.isArray(obj.say) ? obj.say.filter(Boolean).slice(0, 3) : ['ok — i\u2019m with you. keep going.']) as string[]
      const merged = mergeDraft(draft, obj.updated as Draft | undefined)
      setDraft(merged)
      const after: Msg[] = [...nextMsgs, { role: 'companion', say: say.length ? say : ['ok — i\u2019m with you. keep going.'], hasQ: !!obj.has_question }]
      setMsgs(after)
      const ready = obj.decision === 'ready' || nextTurn >= 12
      setThinking(false)
      if (ready) { setPhase('reflect'); void runReflect(after, merged) }
    } catch {
      // Scripted fallback — verbatim behavior from spillFallbackTurn() in iframe.
      const fb = spillFallbackTurn(scrubbed.clean, draft, nextTurn, usedFBRef.current)
      const merged = mergeDraft(draft, fb.updated as Draft)
      setDraft(merged)
      const after: Msg[] = [...nextMsgs, { role: 'companion', say: fb.say, hasQ: fb.hasQ }]
      setMsgs(after)
      setThinking(false)
      if (fb.ready) { setPhase('reflect'); void runReflect(after, merged) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, turn, draft])

  // ─────────────────────────────── reflect ───────────────────────────────
  const runReflect = useCallback(async (allMsgs: Msg[], mergedDraft: Draft) => {
    setThinking(true)
    let summary = ''
    try {
      const convo = allMsgs.filter((m): m is Extract<Msg, { role: 'user' }> => m.role === 'user').map(m => m.text).join(' / ')
      const real = mergedDraft.the_real_thing || ''
      const prompt = 'Say the whole thing back to them, centered on the real thing, in their words, relaxed and warm, lowercase, starting "ok so — stripped down, ". keep it to 1-2 sentences. end with "that about right?" no advice, no diagnosis, no preamble.'
      const raw = await callComplete('their words: ' + convo + '\nthe real thing underneath: ' + real + '\n\n' + prompt)
      summary = (raw || '').trim()
    } catch {
      summary = "ok so — stripped down, this has been weighing on you for a while, and saying it out loud is the first time it's been outside your own head. that about right?"
    }
    setReflectSummary(summary)
    setThinking(false)
    setPhase('support')
  }, [])

  // ─────────────────────────────── compose ───────────────────────────────
  const runCompose = useCallback(async (mode: 'heard' | 'advice') => {
    setSupportMode(mode)
    setPhase('compose')
    const convo = msgs.filter((m): m is Extract<Msg, { role: 'user' }> => m.role === 'user').map(m => m.text).join('\n')
    let c: Composed
    try {
      const prompt =
        'You are THE SPILL on Shutap. Compose the user\u2019s OWN post from the words they just gave you \u2014 a public-ready story in THEIR voice. AUTHENTICITY IS THE PRODUCT: keep their slang, cadence, capitalization, profanity, the messy-real texture, their order of events. every sentence must be traceable to something they actually said. do NOT sanitize it into clean generic prose; do NOT invent any event, name, motive, quote, or detail they didn\u2019t give; do NOT soften or sharpen what happened. title = their own hook, tightened (lowercase ok). body = 2\u20136 short paragraphs, first person.\n\ntheir words (already anonymized \u2014 keep it that way):\n"""' + convo + '"""\n\nthe thing that mattered most: ' + (draft.the_real_thing || draft.emotional_core || '') + '\n\nreturn STRICT JSON only: {"title":"...","body":"...","tags":["short","lowercase","tags"]}'
      const raw = await callComplete(prompt)
      const j = extractJSON<{ title?: string; body?: string; tags?: string[] }>(raw)
      c = {
        title: scrubPII(String(j.title || '').trim()).clean,
        body: scrubPII(String(j.body || '').trim()).clean,
        tags: Array.isArray(j.tags) ? j.tags.slice(0, 5) : (draft.tags || []),
        pillar: draft.pillar,
      }
    } catch {
      const first = msgs.find(m => m.role === 'user') as Extract<Msg, { role: 'user' }> | undefined
      c = {
        title: (first?.text || 'my situation').replace(/\s+/g, ' ').slice(0, 72),
        body: convo,
        tags: (draft.tags || []).slice(0, 5),
        pillar: draft.pillar,
      }
    }
    setComposed(c)
    setPhase('preview')
  }, [msgs, draft])

  // pull manual contenteditable edits back into `composed` + re-scrub.
  const syncPreviewDOM = useCallback(() => {
    setComposed(prev => {
      if (!prev) return prev
      const t = titleElRef.current, b = bodyElRef.current
      const title = t ? scrubPII((t.innerText || '').replace(/\n+/g, ' ').trim()).clean : prev.title
      const body = b ? scrubPII((b.innerText || '').trim()).clean : prev.body
      return { ...prev, title, body }
    })
  }, [])

  const runAIEdit = useCallback(async () => {
    const ins = editInstruction.trim(); if (!ins || !composed) return
    syncPreviewDOM()
    setAiEditing(true)
    try {
      const prompt =
        'You are editing the user\u2019s OWN Shutap post on their instruction. Their voice and facts are sacred. You may shorten, reorder, tighten, fix typos, or do EXACTLY what they asked \u2014 using ONLY material already in the post. Keep their slang, cadence, caps, profanity, mess. NEVER add an event, name, motive, quote, or detail they didn\u2019t give; never soften or sharpen what happened. If the instruction needs a fact that isn\u2019t there, do NOT invent it \u2014 set needs_input and ask (short) what to add.\n\ncurrent title: ' + JSON.stringify(composed.title) +
        '\ncurrent body:\n"""' + composed.body + '"""\n\ntheir instruction: "' + ins + '"\n\nreturn STRICT JSON only: {"title":"...","body":"...","changed":"<one short line on what you changed>","needs_input":false}'
      const raw = await callComplete(prompt)
      const j = extractJSON<{ title?: string; body?: string; changed?: string; needs_input?: boolean }>(raw)
      if (j.needs_input) {
        setEditNote('hmm — ' + (j.changed || 'i\u2019d have to make something up for that. what should i add?'))
      } else {
        setComposed(prev => prev && ({
          ...prev,
          title: j.title ? scrubPII(String(j.title).trim()).clean : prev.title,
          body: j.body ? scrubPII(String(j.body).trim()).clean : prev.body,
        }))
        setEditNote('done — ' + (j.changed || 'tweaked it. take a look.'))
      }
      setEditInstruction('')
    } catch {
      setEditNote('couldn\u2019t make that edit — try saying it another way.')
    }
    setAiEditing(false)
  }, [editInstruction, composed, syncPreviewDOM])

  const publishOrSave = useCallback(async (isPublic: boolean) => {
    if (!composed) return
    syncPreviewDOM()
    const c = composed
    // read the latest edits synchronously from the DOM (state batch may lag).
    const liveTitle = titleElRef.current ? scrubPII((titleElRef.current.innerText || '').replace(/\n+/g, ' ').trim()).clean : c.title
    const liveBody = bodyElRef.current ? scrubPII((bodyElRef.current.innerText || '').trim()).clean : c.body
    const payload = {
      kind: 'spill' as const,
      pillar: (c.pillar || 'relationships') as 'relationships' | 'marriage' | 'family' | 'career',
      clean_text: liveBody,
      title: liveTitle || 'your situation',
      body: liveBody,
      tags: c.tags,
      is_public: isPublic,
      support_mode: supportMode,
    }
    setPhase(isPublic ? 'publishing' : 'saving-journal')
    try {
      const { data: sess } = await supabase.auth.getSession()
      const isAnon = Boolean((sess.session?.user as { is_anonymous?: boolean } | undefined)?.is_anonymous)
      if (!sess.session || isAnon) {
        sessionStorage.setItem('shutap_pending_save', JSON.stringify(payload))
        sessionStorage.setItem('shutap_pending_intent', 'spill')
        navigate('/welcome')
        return
      }
      const res = await save({ data: payload as never })
      try {
        const { trackEvent } = await import('@/lib/tracking')
        const props = { pillar: payload.pillar, is_public: isPublic, has_room: Boolean(res?.room_id) }
        void trackEvent('spill_created', props)
        void trackEvent('spill_submitted', props)
      } catch { /* noop */ }
      setTimeout(() => {
        if (isPublic && res?.room_id) navigate(`/stream#room-${res.room_id}`)
        else navigate('/profile')
      }, 850)
    } catch {
      setEditNote('couldn\u2019t save — try again in a sec.')
      setPhase('preview')
    }
  }, [composed, supportMode, save, navigate, syncPreviewDOM])

  if (!open) return null

  // Chrome step index (matches iframe: chat = turn count, compose = 8, publish = 9)
  const step =
    phase === 'chat' ? Math.max(0, Math.min(7, turn)) :
    phase === 'reflect' || phase === 'support' ? 7 :
    phase === 'compose' || phase === 'preview' ? 8 :
    9
  const lastCompanion = [...msgs].reverse().find((m): m is Extract<Msg, { role: 'companion' }> => m.role === 'companion')
  const bubbles = lastCompanion?.say || []
  const hasQ = !!lastCompanion?.hasQ

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: '#1a0a12' }}>
      {/* shared eye gradients (matches parent Landing defs). */}
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

      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ChromeBar step={step} total={9} onClose={onClose} />

        {(phase === 'chat' || phase === 'reflect' || phase === 'support') && (
          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '34px 22px 28px', maxWidth: 560, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#e7548a' }}>spill</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 'none' }}>{eyeSVG(32)}</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {bubbles.map((t, i) => {
                  const isQ = hasQ && i === bubbles.length - 1
                  const first = i === 0
                  return (
                    <div key={i} style={{
                      alignSelf: 'flex-start', maxWidth: '88%',
                      background: isQ ? 'rgba(231,84,138,.14)' : 'rgba(255,255,255,.05)',
                      border: '.5px solid ' + (isQ ? 'rgba(231,84,138,.32)' : 'rgba(255,255,255,.1)'),
                      borderRadius: first ? '4px 16px 16px 16px' : 16,
                      padding: '10px 14px', fontFamily: NEWSREADER, fontStyle: 'italic',
                      fontSize: first ? 18 : 16, lineHeight: 1.45,
                      color: isQ ? '#f7b8d4' : '#f7e8f0',
                    }}>{t}</div>
                  )
                })}
              </div>
            </div>

            {thinking && <Thinking />}

            {phase === 'chat' && !thinking && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16, padding: '13px 15px' }}>
                <textarea
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const v = input.trim(); if (v) { setInput(''); void runTurn(v) } } }}
                  placeholder={hasQ ? 'answer however it comes…' : 'keep going… i\u2019m listening'}
                  autoFocus
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f7e8f0', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 16, resize: 'none', maxHeight: 140, lineHeight: 1.5 }}
                />
                <div role="button" onClick={() => { const v = input.trim(); if (v) { setInput(''); void runTurn(v) } }} style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#e7548a', cursor: 'pointer', flex: 'none', paddingBottom: 2 }}>send →</div>
              </div>
            )}

            {reflectSummary && (
              <div style={{ background: 'rgba(255,255,255,.04)', borderLeft: '2px solid rgba(231,84,138,.4)', padding: '14px 16px', borderRadius: '0 12px 12px 0', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 15.5, lineHeight: 1.55, color: '#f7e8f0' }}>{reflectSummary}</div>
            )}

            {phase === 'support' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 15, color: '#c4a0b2' }}>real quick — you want advice on this, or you just wanna get it out?</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div role="button" onClick={() => void runCompose('heard')} style={{ cursor: 'pointer', padding: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, textAlign: 'center', transition: '.15s' }}>
                    <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#f7b8d4', marginBottom: 6 }}>just to be heard</div>
                    <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#f7e8f0' }}>sit with me. you don\u2019t have to fix anything.</div>
                  </div>
                  <div role="button" onClick={() => void runCompose('advice')} style={{ cursor: 'pointer', padding: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, textAlign: 'center', transition: '.15s' }}>
                    <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#a8d4a9', marginBottom: 6 }}>open to advice</div>
                    <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#f7e8f0' }}>the room can share what it\u2019d do.</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'compose' && (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '34px 22px', textAlign: 'center' }}>
            <div>
              {eyeSVG(40)}
              <div style={{ marginTop: 16 }}><Thinking text="writing it up in your words…" /></div>
            </div>
          </div>
        )}

        {phase === 'preview' && composed && (
          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: '26px 22px 24px', maxWidth: 580, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: SORA, fontWeight: 600, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#e7548a' }}>preview · in your words</div>
            <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#c4a0b2' }}>nothing\u2019s posted yet. type right over anything to fix it, or tell me what to change below — then pick where it lives.</div>
            {editNote && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13.5, color: '#a8d4a9' }}>
                {eyeSVG(18)}<span>{editNote}</span>
              </div>
            )}
            <div style={{ background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '20px 20px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter', fontWeight: 500, fontSize: 12.5, color: '#9e7a8c', marginBottom: 12 }}>
                🩷 you <span style={{ opacity: .5 }}>· {composed.pillar || 'your story'}</span>
              </div>
              <div
                ref={titleElRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onBlur={syncPreviewDOM}
                style={{ outline: 'none', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 23, lineHeight: 1.3, color: '#f7e8f0', borderRadius: 6, transition: 'background .15s' }}
              >{composed.title || 'untitled'}</div>
              <div
                ref={bodyElRef}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onBlur={syncPreviewDOM}
                style={{ outline: 'none', marginTop: 12, fontFamily: NEWSREADER, fontSize: 16, lineHeight: 1.65, color: '#e7dce4', borderRadius: 6, transition: 'background .15s', whiteSpace: 'pre-wrap' }}
              >{composed.body}</div>
              {composed.tags.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {composed.tags.map((t, i) => (
                    <span key={i} style={{ fontFamily: SORA, fontWeight: 600, fontSize: 10.5, letterSpacing: '.02em', color: '#e7548a', background: 'rgba(231,84,138,.13)', borderRadius: 999, padding: '3px 10px' }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 12.5, color: '#9e7a8c' }}>🔒 every edit gets re-checked by the privacy shield before it saves.</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16, padding: '11px 14px', marginTop: 2 }}>
              <textarea
                rows={1}
                value={editInstruction}
                onChange={e => setEditInstruction(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void runAIEdit() } }}
                placeholder='or tell me: “make it shorter”, “add the part about the rent”…'
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f7e8f0', fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 15, resize: 'none', maxHeight: 120, lineHeight: 1.5 }}
              />
              <div role="button" onClick={() => void runAIEdit()} style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 14, color: '#e7548a', cursor: aiEditing ? 'wait' : 'pointer', flex: 'none', paddingBottom: 2 }}>{aiEditing ? '…' : 'edit →'}</div>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
              <div role="button" onClick={() => void publishOrSave(false)} style={{ cursor: 'pointer', padding: '15px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 15 }}>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#f7b8d4' }}>keep as journal</div>
                <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13.5, color: '#c4a0b2', marginTop: 5 }}>private draft. only you. edit &amp; post whenever.</div>
              </div>
              <div role="button" onClick={() => void publishOrSave(true)} style={{ cursor: 'pointer', padding: '15px 14px', background: '#e7548a', border: '1px solid #e7548a', borderRadius: 15 }}>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff' }}>post to a room →</div>
                <div style={{ fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 13.5, color: '#ffe0ee', marginTop: 5 }}>open it up {supportMode === 'advice' ? 'for what the room would do.' : 'so others who lived it can sit with you.'}</div>
              </div>
            </div>
          </div>
        )}

        {(phase === 'publishing' || phase === 'saving-journal') && (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '34px 22px', textAlign: 'center' }}>
            <div>
              {eyeSVG(50)}
              <div style={{ marginTop: 20, fontFamily: NEWSREADER, fontStyle: 'italic', fontSize: 26, lineHeight: 1.35, color: '#f7e8f0' }}>
                {phase === 'publishing' ? 'your room is open.' : 'saved to your journal.'}
              </div>
              <div style={{ marginTop: 12 }}><Thinking text={phase === 'publishing' ? 'taking you in' : 'opening your journal'} /></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
