// The Companion — four modes: spill, felt_heard, checkin, ask.
// Free voice, lives in the eye, inherits the Constitution.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { COMPANION_CONSTITUTION, CRISIS_COPY } from './constitution'
import { callAgent, tryParseJson, type AgentMessage } from './gateway'

const SPILL_SYS = `${COMPANION_CONSTITUTION}

MODE: SPILL (intake). they're telling you what happened. pull the thread with at most
THREE short questions, one at a time, then stop. you are NOT writing their story — you
are helping them get it out. silently decide the pillar (relationships / marriage /
family / career). do not over-interview — a friend catching the gist, not a therapist
taking history.`

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

    const system =
      data.mode === 'spill' ? SPILL_SYS
      : data.mode === 'felt_heard' ? FELT_HEARD_SYS
      : data.mode === 'checkin' ? CHECKIN_SYS
      : ASK_SYS

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

