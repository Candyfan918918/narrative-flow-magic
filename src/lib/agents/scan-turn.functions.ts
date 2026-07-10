// THE SCAN — adaptive one-card-per-turn engine.
// Measures the SITUATION against social norms (0-999): how far outside
// normal is what happened, and how much should it concern the user.
// Server-side; reuses gateway, scrubber, and Crisis Guard.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent, tryParseJson } from './gateway'
import { runScrub } from './scrubber.functions'
import { runClassifyCrisis } from './guard.functions'

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

type ScanCard = {
  type: z.infer<typeof CardType>
  options?: string[]
  max?: number
  min_label?: string
  max_label?: string
  left?: string
  right?: string
  items?: string[]
  placeholder?: string
}
type Reasoning = {
  norm_distance?: string
  justification?: string
  boundary?: string
  stakes?: string
  pattern?: string
  power_consent?: string
}
type ContinueTurn = {
  done: false
  line: string
  prompt: string
  card: ScanCard
}
type DoneTurn = {
  done: true
  score: number
  band: string
  signature: string
  read: string
  reasoning: Reasoning
  factors: string[]
  basis: 'model_prior'
  corpus_n: null
  cultural_note: string | null
  pillar: string
  crisis?: boolean
}
type TurnOut = ContinueTurn | DoneTurn

export const scanTurn = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TurnInput.parse(d))
  .handler(async ({ data }): Promise<TurnOut> => {
    const { SCAN_PERSONA, sanitizeLine, clampScore, BAND_LABEL, bandFromScore, phraseToBand } =
      await import('./scan-turn.server')

    // Scrub + crisis-check any free-text answer
    if (data.last_text && data.last_text.length > 1) {
      const scrub = await runScrub(data.last_text)
      const guard = await runClassifyCrisis(scrub.clean_text)
      if (guard.crisis) {
        return {
          done: true,
          crisis: true,
          score: 950,
          band: BAND_LABEL.far_outside,
          signature: 'Pause For Safety',
          read: 'this is a lot to carry. you matter — and there are people trained for this exact moment.',
          reasoning: {
            norm_distance: 'safety concern (n/a)',
            justification: 'none',
            boundary: 'safety',
            stakes: 'high',
            pattern: 'ongoing',
            power_consent: 'n/a',
          },
          factors: ['safety'],
          basis: 'model_prior',
          corpus_n: null,
          cultural_note: null,
          pillar: 'self',
        }
      }
    }

    const usedTypes = data.history.slice(-2).map((h) => h.type)
    const transcript = data.history
      .map((h, i) => `card ${i + 1} (${h.type}): "${h.prompt}"\nanswer: ${JSON.stringify(h.answer)}`)
      .join('\n\n')

    const turnIndex = data.history.length
    const softCap = turnIndex >= 10
    const depthHint = [
      'card 1 — greet by alias; open with a warm free-text ask: what actually happened',
      'card 2 — pin down WHO and the concrete said/done (their nouns, their words)',
      'card 3 — CONTEXT: what surrounded it, what came before',
      'card 4 — JUSTIFICATION: what reason (if any) did they give? this is required',
      'card 5 — FREQUENCY: one-off, repeated, ongoing?',
      'card 6 — STAKES: what is concretely at risk',
      'card 7 — their_response: what they did/said/decided; feeling captured briefly',
      'card 8+ — fill any missing slot, then FINISH with the result',
      'card 10+ — FINISH now with the result JSON',
      'card 11+ — WRAP UP THIS TURN with the finishing JSON',
    ][Math.min(turnIndex, 9)]

    const userMsg = `${SCAN_PERSONA}

alias: ${data.alias ?? 'friend'}
turn index: ${turnIndex}
depth: ${depthHint}
${softCap ? 'YOU ARE AT THE SOFT CAP — return the finishing JSON now.' : ''}
last two widget types used: ${usedTypes.length ? usedTypes.join(', ') : '(none)'} — DO NOT REPEAT.

prior cards:
${transcript || '(none yet — open with a warm greeting that uses the alias and a free-text ask)'}`

    const llm = await callAgent({
      messages: [{ role: 'user', content: userMsg }],
      maxTokens: 520,
    })
    const parsed = tryParseJson<TurnOut>(llm.text)
    if (!parsed) {
      // Fallback finisher so the user never gets stuck.
      return {
        done: true,
        score: 400,
        band: BAND_LABEL.uncommon,
        signature: 'Not Enough To Read',
        read: "couldn't get a clean read on this one from what we have. name what happened and what reason they gave, and try again.",
        reasoning: {
          norm_distance: 'unclear',
          justification: 'unclear',
          boundary: 'unclear',
          stakes: 'unclear',
          pattern: 'unclear',
          power_consent: 'unclear',
        },
        factors: ['not enough info'],
        basis: 'model_prior',
        corpus_n: null,
        cultural_note: null,
        pillar: 'self',
      }
    }

    if ('done' in parsed && parsed.done) {
      const score = clampScore(Number(parsed.score) || 400)
      const bandKey = phraseToBand(parsed.band) ?? bandFromScore(score)
      return {
        done: true,
        score,
        band: BAND_LABEL[bandKey],
        signature: sanitizeLine(parsed.signature, 60) || 'A Read',
        read: sanitizeLine(parsed.read, 400) || 'this one is real.',
        reasoning: (parsed.reasoning ?? {}) as Reasoning,
        factors: Array.isArray(parsed.factors)
          ? parsed.factors.slice(0, 6).map((f) => sanitizeLine(String(f), 40))
          : [],
        basis: 'model_prior',
        corpus_n: null,
        cultural_note: parsed.cultural_note != null ? sanitizeLine(String(parsed.cultural_note), 200) || null : null,
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
      done: false,
      line: sanitizeLine(cont.line, 200) || "okay — i'm with you.",
      prompt: sanitizeLine(cont.prompt, 200) || 'what else?',
      card: cont.card ?? { type: 'text', placeholder: 'in a few words…' },
    }
  })
