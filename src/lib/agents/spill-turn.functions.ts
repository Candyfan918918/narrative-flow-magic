// Spill turn engine (§1). Per-turn react→name→read→ask interview that walks the
// 7-beat arc until ready, then signals decision:"ready". Runs Crisis Guard + PII
// Scrubber first; calls the gateway with the persona as a real system prompt
// and validates strict JSON, one repair retry, falls back to a deterministic
// arc-walking question if both fail.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { callAgent, tryParseJson } from './gateway'
import { scrubText } from './scrubber.functions'
import { classifyCrisis } from './guard.functions'
import { CRISIS_COPY } from './constitution'

const Beat = z.object({
  what_happened: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  feeling: z.string().nullable().optional(),
  why: z.string().nullable().optional(),
  talked_to_them: z.string().nullable().optional(),
  other_attempts: z.string().nullable().optional(),
  plan: z.string().nullable().optional(),
}).partial()

const TurnInput = z.object({
  alias: z.string().min(1).max(40).default('friend'),
  transcript: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).max(60).default([]),
  arc: Beat.default({}),
  pillar: z.enum(['relationships', 'marriage', 'family', 'career']).nullable().optional(),
  humor_ok: z.boolean().default(true),
  turn_count: z.number().int().min(0).max(40).default(0),
})

export type SpillTurnResult = {
  say: string[]
  has_question: boolean
  relief_lever: 'not_crazy' | 'anyone_would' | 'i_see_it' | 'named_the_real_thing' | 'on_your_side'
  humor_ok: boolean
  updated: {
    pillar: string | null
    tags: string[]
    anchor: string | null
    emotional_core: string | null
    the_real_thing: string | null
    named_and_landed: boolean
    arc: z.infer<typeof Beat>
  }
  decision: 'continue' | 'ready'
  notice?: string
  crisis?: boolean
}

const SYSTEM = `you are the spill — a warm, funny, group-chat friend taking the user's side.
voice: lowercase, texty, fragments good, ≤ ~30 words total per turn, 1–3 short bubbles.
EVERY turn, in order: REACT + take their side → NAME the feeling/maneuver (state the obvious, never ask it) → optional READ (the thing under the thing, as a guess) → THEN maybe one concrete question.
each turn carries ≥1 relief lever: not_crazy | anyone_would | i_see_it | named_the_real_thing | on_your_side.
you DIG: ask the next still-blank arc beat, phrased naturally (never read the checklist aloud).
arc beats (cover all before ready, "i don't know" counts): what_happened → frequency/where → feeling (push past the first word) → why it lands → talked_to_them + result → other_attempts + result → plan.
finish gates: NEVER finish before action + plan are covered, or charge flattens, or soft cap (~12 turns). don't stop just because the feeling got named.
hard bans: "sit with that" · "hold space" · "that's valid" · "i hear you" · "thank you for sharing" · "it sounds like" · "that must be hard" · "how did that make you feel". no therapy-speak, no diagnosis, no labeling the person, no verdict/jury/court language.
humor only while humor_ok=true. never invent facts.
return ONLY strict JSON, no prose:
{ "say": ["..."], "has_question": true, "relief_lever": "...", "humor_ok": true,
  "updated": { "pillar": "relationships|marriage|family|career|null", "tags": ["..."],
    "anchor": "...|null", "emotional_core": "...|null", "the_real_thing": "...|null",
    "named_and_landed": false,
    "arc": { "what_happened": null|"...", "frequency": null|"...", "feeling": null|"...",
             "why": null|"...", "talked_to_them": null|"...", "other_attempts": null|"...", "plan": null|"..." } },
  "decision": "continue|ready", "why": "<internal>" }`

const ARC_QUESTIONS: Array<[keyof z.infer<typeof Beat>, string]> = [
  ['what_happened', "what actually happened — give me the scene."],
  ['frequency', "is this a one-off or does this keep happening?"],
  ['feeling', "and what's underneath that — past the first word?"],
  ['why', "why does this one land so hard for you?"],
  ['talked_to_them', "did you talk to them about it? what came back?"],
  ['other_attempts', "what else have you tried already?"],
  ['plan', "what do you think you'll do next?"],
]

function fallbackTurn(input: z.infer<typeof TurnInput>): SpillTurnResult {
  const blank = ARC_QUESTIONS.find(([k]) => !input.arc?.[k])
  if (!blank || input.turn_count >= 11) {
    return {
      say: [`ok ${input.alias} — i think i've got enough. ready to put words to it?`],
      has_question: false,
      relief_lever: 'on_your_side',
      humor_ok: input.humor_ok,
      updated: {
        pillar: input.pillar ?? null,
        tags: [],
        anchor: null,
        emotional_core: null,
        the_real_thing: null,
        named_and_landed: true,
        arc: input.arc ?? {},
      },
      decision: 'ready',
    }
  }
  const greeting = input.turn_count === 0 ? [`heyyy 🌸 ${input.alias} — i'm fully on your side. what's up?`] : []
  return {
    say: [...greeting, blank[1]].slice(0, 3),
    has_question: true,
    relief_lever: 'on_your_side',
    humor_ok: input.humor_ok,
    updated: {
      pillar: input.pillar ?? null,
      tags: [],
      anchor: null,
      emotional_core: null,
      the_real_thing: null,
      named_and_landed: false,
      arc: input.arc ?? {},
    },
    decision: 'continue',
  }
}

export const spillTurn = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => TurnInput.parse(d))
  .handler(async ({ data }): Promise<SpillTurnResult> => {
    const last = data.transcript[data.transcript.length - 1]
    const userText = last?.role === 'user' ? last.content : ''

    // Scrub + Guard on the latest user turn before any persona response.
    let notice = ''
    let cleanedTranscript = data.transcript
    if (userText) {
      const scrub = await scrubText({ data: { raw: userText } })
      notice = scrub.notice
      cleanedTranscript = [
        ...data.transcript.slice(0, -1),
        { role: 'user' as const, content: scrub.clean_text },
      ]
      const guard = await classifyCrisis({ data: { clean_text: scrub.clean_text } })
      if (guard.crisis) {
        return {
          say: [CRISIS_COPY],
          has_question: false,
          relief_lever: 'on_your_side',
          humor_ok: false,
          updated: {
            pillar: data.pillar ?? null, tags: [], anchor: null,
            emotional_core: null, the_real_thing: null, named_and_landed: false,
            arc: data.arc ?? {},
          },
          decision: 'ready',
          crisis: true,
          notice,
        }
      }
    }

    const blankBeats = ARC_QUESTIONS.filter(([k]) => !data.arc?.[k]).map(([k]) => k)
    const context = JSON.stringify({
      alias: data.alias,
      pillar: data.pillar ?? null,
      turn_count: data.turn_count,
      arc: data.arc ?? {},
      blank_beats: blankBeats,
      humor_ok: data.humor_ok,
    })
    const transcriptText = cleanedTranscript
      .map(m => `${m.role === 'user' ? 'them' : 'spill'}: ${m.content}`)
      .join('\n')

    const userMessage = `context:\n${context}\n\nconversation so far:\n${transcriptText}\n\nrespond now with strict JSON only.`

    let parsed: SpillTurnResult | null = null
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      const ext = attempt === 0 ? '' : '\nreturn valid JSON only — no prose.'
      const { text, error } = await callAgent({
        system: SYSTEM + ext,
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 700,
      })
      if (error || !text) break
      parsed = tryParseJson<SpillTurnResult>(text)
    }

    if (!parsed) parsed = fallbackTurn(data)
    if (notice) parsed.notice = notice
    return parsed
  })
