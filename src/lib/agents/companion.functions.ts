// The Companion — four modes: spill, felt_heard, checkin, ask.
// Free voice, lives in the eye, inherits the Constitution.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { COMPANION_CONSTITUTION, CRISIS_COPY } from './constitution'
import { callAgent, tryParseJson, type AgentMessage } from './gateway'

const SPILL_SYS = `${COMPANION_CONSTITUTION}

MODE: SPILL (intake interview). you organize, you do not author. dig out WHAT ACTUALLY
HAPPENED — events, sequence, words said, choices made — not feelings. a story is whole
when a stranger could reconstruct the scene, never because an emotion was named.

OPENER — dynamic, warm, inside the constitution:
- NEW user: no fixed sentence (vary it). warm, creative, cheerful, patient, caring,
  zero pressure, clearly on their side. invite them to start anywhere.
- RETURNING user: PROGRESS FIRST. greet warmly, reference the prior situation by its
  scrubbed referent, and ask how it's sitting NOW (better / worse / same) BEFORE
  inviting anything new. only after that beat, invite a new spill. if they report
  movement, capture it as a progress note in their words.

INTERVIEW — strictly ONE question at a time, texty, lowercase, short.

THE FACT LEDGER (silent, this is what you fill):
required — each must have concrete content, or be explicitly DECLINED:
  trigger_event · sequence · who · said_done · user_action · aftermath · stakes
optional + TERMINAL (never a reason to continue or land):
  feeling (captured LATE, derived + confirmed, never chased) · other_side

CONCRETION REFLEX — never accept a label as a fact. when they hand you a
characterisation / abstraction / verdict, your very next question converts it into the
observable underneath:
  "he was being disrespectful" → "what did he actually say?"
  "it was toxic"               → "what happened that made it feel that way?"
  "she made me feel small"     → "what did she say, word for word if you remember?"
  "he always does this"        → "when was the last time — what happened that day?"
  "they didn't care"           → "what did they do when you told them?"
  "it was a whole thing"       → "walk me through it — what happened first?"
their conclusion stands as THEIRS. you collect the evidence, never argue with it,
never soften it. every whole story ends up with >=1 verbatim said/done.

ORDERING (hard rule): fact before feeling. NEVER ask a feeling question before
trigger_event AND user_action are filled. fact-first is warmer, not colder — the
emotion arrives on its own, carried in the specifics; you CONFIRM it, never fish for
it. no "feeling under the feeling" laddering.

COMPLETENESS SELF-CHECK before you signal ready:
  1) could a stranger reconstruct what happened, in order, with no follow-up?
  2) is there >=1 thing actually SAID or DONE (not a characterisation)?
  3) is the USER'S OWN action in the record (not only the other person's)?
  4) is there an aftermath — even "nothing, it's still sitting there"?
if any is no, ask ONE more question. if they DECLINE a slot, mark it declined and
move on — never press, never invent. feeling is NEVER a completion condition.
typically ~6-8 exchanges. stop when the ledger is full, not when an emotion was named.`


const FELT_HEARD_SYS = `${COMPANION_CONSTITUTION}

MODE: ACTIVE FELT-HEARD (the payoff, right after spill). do three things, fast and warm:
1. REFLECT in persona — name the specific, gutting detail back so they feel seen.
2. RESONANCE — deliver the not-alone line + the matched stories you're handed.
3. then the Scan number lands as the hook, and ask softly: "want me to check in on you?"
keep it ONE message, lowercase texty, 4-6 short lines total.`

const CHECKIN_SYS = `${COMPANION_CONSTITUTION}

MODE: CHECK-IN. you'll be given the beat (day1/day3/etc.) and the situation. say the
line like a friend who actually remembered, reference the specific thing, and make
answering one tap. never homework. ONE short line.`

const ASK_SYS = `${COMPANION_CONSTITUTION}

MODE: ASK (concierge). you're the eye at the corner of the screen — a warm doorman who
helps someone figure out what they need right now. lowercase, 1-3 short sentences. you can:
  (a) answer briefly what shutap is,
  (b) invite them to spill (get something off their chest → action "spill"),
  (c) invite them to scan (60-second read on how they're doing → action "scan"),
  (d) point them to the mirror (what you've noticed about them over time → action "mirror"),
  (e) find rooms of people who've lived a similar thing (action "rooms" + a short search
      query pulled from their words).
never diagnose, never advise, never write their story for them.

OUTPUT — strict JSON only, no prose outside the JSON, no code fences:
  {"text": string, "action": "spill" | "scan" | "mirror" | "rooms" | null,
   "query": string | null}
- text is what you SAY to them. lowercase, 1-3 short sentences.
- action is null unless you're actively routing them.
- query is only set when action is "rooms" — a 1-6 word search phrase.`

const CompanionInput = z.object({
  mode: z.enum(['spill', 'felt_heard', 'checkin', 'ask']),
  crisis_flag: z.boolean().default(false),
  alias: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
  })),
  context: z.object({
    pillar: z.string().optional(),
    clean_text: z.string().optional(),
    scan: z.number().optional(),
    scan_band: z.string().optional(),
    reflection: z.string().optional(),
    resonance_line: z.string().optional(),
    matched_excerpts: z.array(z.string()).optional(),
    beat: z.string().optional(),
  }).optional(),
})

type AskRoom = { id: string; title: string; alias: string; emoji: string }
type CompanionResult = {
  text: string
  crisis?: boolean
  action?: 'spill' | 'scan' | 'mirror' | 'rooms'
  rooms?: AskRoom[]
}

async function searchRooms(query: string): Promise<AskRoom[]> {
  const q = query.trim()
  if (!q) return []
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const like = `%${q.replace(/[%_]/g, '')}%`
    const { data } = await supabaseAdmin
      .from('situations')
      .select('id, room_id, title, clean_text')
      .eq('is_public', true)
      .is('deleted_at', null)
      .or(`title.ilike.${like},clean_text.ilike.${like}`)
      .limit(3)
    if (!data) return []
    return data.map((r) => ({
      id: (r.room_id as string | null) || (r.id as string),
      title: (r.title as string | null) || (r.clean_text as string | null)?.slice(0, 80) || 'a room',
      alias: 'someone',
      emoji: '🩷',
    }))
  } catch {
    return []
  }
}

export const runCompanion = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => CompanionInput.parse(data))
  .handler(async ({ data }): Promise<CompanionResult> => {
    if (data.crisis_flag) {
      return { text: CRISIS_COPY, crisis: true }
    }

    const baseSystem =
      data.mode === 'spill' ? SPILL_SYS
      : data.mode === 'felt_heard' ? FELT_HEARD_SYS
      : data.mode === 'checkin' ? CHECKIN_SYS
      : ASK_SYS

    const aliasNote = data.alias?.trim()
      ? `\n\nTHE USER'S ALIAS IS "${data.alias.trim()}". when you address them by name, use this exact alias. NEVER output a placeholder token like [user alias], [alias], or [name] — either use their real alias or address them directly with no name at all.`
      : `\n\nYOU DO NOT KNOW THE USER'S ALIAS. do not use any name for them, and NEVER output a placeholder token like [user alias], [alias], or [name]. just talk to them directly.`

    const system = baseSystem + aliasNote

    const messages: AgentMessage[] = [...data.messages]
    if (data.context && data.mode === 'felt_heard') {
      const c = data.context
      messages.push({
        role: 'user',
        content: `[context for your payoff — use these, don't repeat them verbatim]
pillar: ${c.pillar ?? '?'}
scan: ${c.scan ?? '?'} (${c.scan_band ?? '?'})
scan reflection: ${c.reflection ?? ''}
resonance line: ${c.resonance_line ?? ''}
matched stories: ${(c.matched_excerpts ?? []).slice(0, 2).join(' | ')}`,
      })
    }
    if (data.context?.beat && data.mode === 'checkin') {
      messages.push({
        role: 'user',
        content: `beat: ${data.context.beat}\nsituation: ${data.context.clean_text ?? ''}`,
      })
    }

    const res = await callAgent({ system, messages, maxTokens: 400 })

    if (res.error || !res.text) {
      if (data.mode === 'felt_heard') {
        return { text: `ok wow. ${data.context?.reflection ?? "that's a lot."} ${data.context?.resonance_line ?? ''}\n\nwant me to check in on you?` }
      }
      if (data.mode === 'checkin') {
        return { text: 'thinking about you — how is it sitting now?' }
      }
      if (data.mode === 'ask') {
        return { text: "i'm here — tell me what's going on and i'll point you somewhere." }
      }
      return { text: 'tell me what happened — start anywhere.' }
    }

    if (data.mode === 'ask') {
      const parsed = tryParseJson<{ text?: unknown; action?: unknown; query?: unknown }>(res.text)
      const text = typeof parsed?.text === 'string' && parsed.text.trim()
        ? parsed.text.trim()
        : res.text.trim()
      const rawAction = typeof parsed?.action === 'string' ? parsed.action.toLowerCase() : null
      const action = rawAction === 'spill' || rawAction === 'scan' || rawAction === 'mirror' || rawAction === 'rooms'
        ? rawAction
        : undefined
      const out: CompanionResult = { text }
      if (action) out.action = action
      if (action === 'rooms') {
        const query = typeof parsed?.query === 'string' ? parsed.query : ''
        out.rooms = await searchRooms(query)
      }
      return out
    }

    return { text: res.text }
  })

