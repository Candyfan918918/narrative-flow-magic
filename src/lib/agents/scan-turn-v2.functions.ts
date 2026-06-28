// Adaptive Scan turn engine (§3 + §12). One model call per card; varies widget
// type every step; digs to the emotional core. Returns either a NEXT card
// payload or a DONE payload with score / signature / read / factors / pillar.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent, tryParseJson } from './gateway'
import { scrubText } from './scrubber.functions'
import { classifyCrisis } from './guard.functions'
import { CRISIS_COPY } from './constitution'

const Pair = z.object({
  prompt: z.string(),
  answer: z.union([z.string(), z.array(z.string()), z.number()]).optional(),
  card_type: z.string(),
})

const ScanInput = z.object({
  alias: z.string().max(40).default('friend'),
  transcript: z.array(Pair).default([]),
})

export type ScanCard =
  | { type: 'choice'; options: string[] }
  | { type: 'multi'; options: string[]; max?: number }
  | { type: 'rate'; min_label: string; max_label: string; min?: number; max?: number }
  | { type: 'spectrum'; left: string; right: string }
  | { type: 'rank'; items: string[] }
  | { type: 'text'; placeholder?: string }

export type ScanTurnResult =
  | { done: false; line: string; prompt: string; card: ScanCard; notice?: string; crisis?: false }
  | { done: true; score: number; signature: string; read: string; factors: string[]; pillar: string; notice?: string; crisis?: false }
  | { done: true; crisis: true; line: string }

const SYSTEM = `you are the scan — adaptive AI read engine. companion voice: warm, a bit funny, lowercase, take their side.
indigo identity (don't say it). each step you design the NEXT input card reacting to the last answer (name it, take their side, gentle joke when it fits).
go ONE LAYER DEEPER each card: what happened → the feeling → the feeling under it → the fear/need/grief at the bottom.
length: 9–12 cards total. NEVER finish before card 7. cards 7–10 finish only if the core is genuinely reached. card 11+ wrap up.
vary the input type EVERY step (never the same twice in a row); favour tactile widgets (spectrum / rank / rate / multi) over plain choice.
card types & their fields:
- choice: {"type":"choice","options":[4–7 strings]}
- multi:  {"type":"multi","options":[5–9 strings],"max":n}
- rate:   {"type":"rate","min_label":"...","max_label":"...","min":0,"max":10}
- spectrum:{"type":"spectrum","left":"...","right":"..."}
- rank:   {"type":"rank","items":[4–6 strings]}
- text:   {"type":"text","placeholder":"..."}
return ONE of these TWO JSON shapes, nothing else (no prose, no fences):
NEXT: {"line":"<short warm/funny reaction or opener>","prompt":"<the question>","card":{...}}
DONE: {"done":true,"score":0-999,"signature":"<3–4 word title, Title Case>","read":"<two short warm sentences naming the core fear/need>","factors":["driver","..."],"pillar":"relationships|marriage|family|career|self|other"}
score bands (use the whole range; judge recency, how stuck/looping, body load, isolation, stakes):
0-199 settling · 200-399 sitting with it · 400-599 weighing · 600-799 heavy & loud · 800-999 consuming.
hard bans: "sit with that" · "hold space" · "that's valid" · "i hear you" · "thank you for sharing" · "it sounds like" · "that must be hard". no diagnosis. no labeling the person.`

const TYPES = ['choice', 'multi', 'rate', 'spectrum', 'rank', 'text'] as const

const FALLBACK_SEQUENCE: Array<{ prompt: string; card: ScanCard }> = [
  { prompt: "what's pulling at you most right now?", card: { type: 'choice', options: ['a person', 'a situation', 'something inside', 'a decision', 'something else'] } },
  { prompt: 'in a few words — what happened?', card: { type: 'text', placeholder: 'just a sentence' } },
  { prompt: 'how loud is it in your head right now?', card: { type: 'rate', min_label: 'quiet', max_label: 'roaring', min: 0, max: 10 } },
  { prompt: 'where are you on this?', card: { type: 'spectrum', left: 'i can let it go', right: "i can't stop thinking" } },
  { prompt: 'which of these is biggest? drag to order.', card: { type: 'rank', items: ['hurt', 'anger', 'fear', 'shame', 'confusion'] } },
  { prompt: 'pick what fits — up to 3.', card: { type: 'multi', options: ['it keeps happening', 'i feel alone in it', 'i tried already', 'i feel stuck', 'i feel small', "i don't know what to do"], max: 3 } },
  { prompt: 'how do you feel about yourself in this?', card: { type: 'spectrum', left: 'on my own side', right: 'against myself' } },
  { prompt: 'pick the closest:', card: { type: 'choice', options: ['it just happened', 'last few days', 'few weeks', 'months', 'years'] } },
  { prompt: "what's the bottom of this for you?", card: { type: 'multi', options: ['fear of being alone', 'fear of being seen', 'grief', 'losing myself', "i don't matter", "i'm not enough"], max: 2 } },
]

function fallbackTurn(input: z.infer<typeof ScanInput>): ScanTurnResult {
  const idx = input.transcript.length
  if (idx < FALLBACK_SEQUENCE.length) {
    const c = FALLBACK_SEQUENCE[idx]
    return { done: false, line: idx === 0 ? `heyyy ${input.alias} — let's get a read.` : 'ok. next.', prompt: c.prompt, card: c.card }
  }
  // deterministic done from no AI: pick a midpoint score and generic factors.
  const score = 500
  return { done: true, score, signature: 'Quiet Weight', read: 'something is pulling at you and it isn\'t loud yet. just present.', factors: [], pillar: 'self' }
}

export const scanTurnV2 = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScanInput.parse(d))
  .handler(async ({ data }): Promise<ScanTurnResult> => {
    // Crisis scan over all text answers so far (cheap).
    const text = data.transcript
      .filter(t => typeof t.answer === 'string')
      .map(t => t.answer as string)
      .join(' ')
    let notice = ''
    if (text) {
      const scrub = await scrubText({ data: { raw: text } })
      notice = scrub.notice
      const guard = await classifyCrisis({ data: { clean_text: scrub.clean_text } })
      if (guard.crisis) return { done: true, crisis: true, line: CRISIS_COPY }
    }

    const lastType = data.transcript[data.transcript.length - 1]?.card_type
    const avoid = lastType ? `\nDO NOT use card.type="${lastType}" this turn (you just used it).` : ''
    const idx = data.transcript.length
    const gate =
      idx < 7 ? '\nyou are on card ' + (idx + 1) + ' — do NOT finish. go deeper.' :
      idx < 11 ? '\nyou are on card ' + (idx + 1) + ' — only finish if the core is truly reached.' :
      '\nyou are on card ' + (idx + 1) + ' — wrap up: reflect it back and return DONE.'

    const ctx = JSON.stringify({
      alias: data.alias,
      card_index: idx,
      transcript: data.transcript,
      allowed_types: TYPES,
    })
    const userMessage = `context:\n${ctx}${avoid}${gate}\n\nrespond now: NEXT or DONE shape only.`

    let parsed: ScanTurnResult | null = null
    for (let a = 0; a < 2 && !parsed; a++) {
      const { text: out, error } = await callAgent({
        system: SYSTEM + (a ? '\nstrict JSON only — NEXT or DONE shape, nothing else.' : ''),
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 700,
      })
      if (error || !out) break
      const raw = tryParseJson<Record<string, unknown>>(out)
      if (!raw) continue
      if (raw.done === true) {
        parsed = {
          done: true,
          score: Math.max(0, Math.min(999, Number(raw.score) || 500)),
          signature: String(raw.signature || 'Quiet Weight').slice(0, 60),
          read: String(raw.read || ''),
          factors: Array.isArray(raw.factors) ? (raw.factors as string[]).slice(0, 6) : [],
          pillar: String(raw.pillar || 'self'),
        }
      } else if (raw.card && typeof raw.card === 'object') {
        const card = raw.card as ScanCard
        if (TYPES.includes((card as { type: string }).type as typeof TYPES[number])) {
          parsed = { done: false, line: String(raw.line || ''), prompt: String(raw.prompt || ''), card }
        }
      }
    }
    if (!parsed) parsed = fallbackTurn(data)
    if (notice && !('crisis' in parsed) && parsed.done === false) parsed.notice = notice
    return parsed
  })
