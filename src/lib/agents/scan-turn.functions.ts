// The adaptive SCAN — one AI-driven card per turn, dig one layer deeper each
// step, finish with score/signature/read. Server-side; reuses the gateway,
// scrubber, and Crisis Guard from existing agents.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent, tryParseJson } from './gateway'
import { scrubText } from './scrubber.functions'
import { classifyCrisis } from './guard.functions'

const CardType = z.enum(['choice', 'multi', 'rate', 'spectrum', 'rank', 'text'])
const TurnInput = z.object({
  alias: z.string().max(60).optional(),
  history: z
    .array(
      z.object({
        prompt: z.string().max(400),
        type: CardType,
        answer: z.union([
          z.string().max(2000),
          z.array(z.string().max(120)),
          z.number(),
          z.null(),
        ]),
      }),
    )
    .max(20)
    .default([]),
  last_text: z.string().max(2000).optional(),
})

type ContinueTurn = {
  done?: false
  line: string
  prompt: string
  card: { type: z.infer<typeof CardType>; [k: string]: unknown }
}
type DoneTurn = {
  done: true
  score: number
  signature: string
  read: string
  factors: string[]
  pillar: string
}
type TurnOut = (ContinueTurn | DoneTurn) & { crisis?: boolean }

export const scanTurn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TurnInput.parse(d))
  .handler(async ({ data }): Promise<TurnOut> => {
    const { SCAN_PERSONA, sanitizeLine, clampScore } = await import('./scan-turn.server')

    // Scrub + crisis-check any free-text answer
    if (data.last_text && data.last_text.length > 1) {
      const scrub = await scrubText({ data: { raw: data.last_text } })
      const guard = await classifyCrisis({ data: { clean_text: scrub.clean_text } })
      if (guard.crisis) {
        return {
          done: true,
          crisis: true,
          score: 950,
          signature: 'pause for safety',
          read: 'this is a lot to carry. you matter — and there are people trained for this exact moment.',
          factors: ['safety'],
          pillar: 'self',
        }
      }
    }

    const usedTypes = data.history.slice(-2).map((h) => h.type)
    const transcript = data.history
      .map((h, i) => `card ${i + 1} (${h.type}): "${h.prompt}"\nanswer: ${JSON.stringify(h.answer)}`)
      .join('\n\n')

    const turnIndex = data.history.length
    const softCap = turnIndex >= 6
    const depthHint = [
      'card 1 — concrete scene (what happened)',
      'card 2 — the feeling on top',
      'card 3 — feeling under that feeling',
      'card 4 — fear/need/grief at the bottom',
      'card 5 — converging; if core is named, FINISH next turn',
      'card 6 — FINISH this turn with the score+read',
    ][Math.min(turnIndex, 5)]

    const userMsg = `${SCAN_PERSONA}

alias: ${data.alias ?? 'friend'}
turn index: ${turnIndex}
depth: ${depthHint}
${softCap ? 'YOU ARE AT THE SOFT CAP — return the finishing JSON now.' : ''}
last two widget types used: ${usedTypes.length ? usedTypes.join(', ') : '(none)'} — DO NOT REPEAT.

prior cards:
${transcript || '(none yet — open with a warm greeting that uses the alias)'}`

    const llm = await callAgent({
      messages: [{ role: 'user', content: userMsg }],
      maxTokens: 380,
    })
    const parsed = tryParseJson<TurnOut>(llm.text)
    if (!parsed) {
      // Fallback finisher so the user never gets stuck.
      return {
        done: true,
        score: 500,
        signature: 'sitting with it',
        read: "couldn't get a clean read on this one — but it's clearly weighing on you.",
        factors: ['recurring'],
        pillar: 'self',
      }
    }

    if ('done' in parsed && parsed.done) {
      return {
        done: true,
        score: clampScore(Number(parsed.score) || 500),
        signature: sanitizeLine(parsed.signature, 60) || 'sitting with it',
        read: sanitizeLine(parsed.read, 400) || 'this one is real.',
        factors: Array.isArray(parsed.factors) ? parsed.factors.slice(0, 6).map((f) => sanitizeLine(String(f), 40)) : [],
        pillar: ['relationships', 'marriage', 'family', 'career', 'self', 'other'].includes(
          String(parsed.pillar),
        )
          ? (parsed.pillar as string)
          : 'self',
      }
    }

    const cont = parsed as ContinueTurn
    // If model repeats a banned widget type, nudge to text
    if (cont.card && usedTypes.includes(cont.card.type)) {
      cont.card = { ...cont.card, type: 'text', placeholder: 'in a few words…' }
    }
    return {
      line: sanitizeLine(cont.line, 200) || 'okay — i'm with you.',
      prompt: sanitizeLine(cont.prompt, 200) || 'what else?',
      card: cont.card ?? { type: 'text', placeholder: 'in a few words…' },
    }
  })
