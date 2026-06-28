// The Companion — three modes: spill, felt_heard, checkin.
// Free voice, lives in the eye, inherits the Constitution.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { COMPANION_CONSTITUTION, CRISIS_COPY } from './constitution'
import { callAgent, type AgentMessage } from './gateway'

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

const CompanionInput = z.object({
  mode: z.enum(['spill', 'felt_heard', 'checkin']),
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

export const runCompanion = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => CompanionInput.parse(data))
  .handler(async ({ data }): Promise<{ text: string; crisis?: boolean }> => {
    if (data.crisis_flag) {
      return { text: CRISIS_COPY, crisis: true }
    }

    const system =
      data.mode === 'spill' ? SPILL_SYS
      : data.mode === 'felt_heard' ? FELT_HEARD_SYS
      : CHECKIN_SYS

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
      // graceful fallback voice
      if (data.mode === 'felt_heard') {
        return { text: `ok wow. ${data.context?.reflection ?? "that's a lot."} ${data.context?.resonance_line ?? ''}\n\nwant me to check in on you?` }
      }
      if (data.mode === 'checkin') {
        return { text: 'thinking about you — how is it sitting now?' }
      }
      return { text: 'tell me what happened — start anywhere.' }
    }
    return { text: res.text }
  })
