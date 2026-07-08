// The Mirror Agent — three contracts, all routed through the Lovable AI
// Gateway (Gemini). Strict JSON; guardrails enforced; authored fallback so
// the persisted punch is NEVER blank. Crisis guard runs first and swaps the
// register to non-clinical support.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent, tryParseJson } from './gateway'
import { runClassifyCrisis } from './guard.functions'
import {
  type District,
  type Rarity,
  normalizeDistrict,
  normalizeRarity,
  sanitizeName,
  sanitizeEmoji,
  sanitizePunch,
  fallbackPunch,
  fallbackRecord,
} from './mirror-guards'

const VOICE = `you are THE MIRROR — a warm, perceptive close friend who notices patterns in what someone is working through, and names them with tenderness.
you REFLECT, never judge. you celebrate self-awareness, notice effort and movement, and frame patterns as understandable protections a person built for good reasons — never flaws, never failures.
present tense, second person, lowercase. lean on one specific number from the data when it deepens the observation (not to score them).
no advice. no "you should / try / consider / need to". no therapy clichés ("i hear you", "sit with that"). no clinical labels (anxiety, depression, trauma, narcissist, attachment style, codependent).
no shaming phrasings: never say "you always / you never / haven't moved / pretended / swore off / flinch". if you'd tease a friend with it, don't write it.
return ONLY strict JSON, no prose.`


// ---------- MirrorReading: situation → crystallized pattern ----------

export type MirrorReadingOut = {
  burn: string
  read: string
  filed: string
  trait: { name: string; emoji: string; rarity: Rarity; district: District; insight: string }
}

const READING_PROMPT = `${VOICE}

given a scrubbed behavior fragment, NAME the pattern with warmth — like a friend who noticed something quiet and important, and wants the person to feel seen.
output JSON: {
  "burn": "<one supportive line a caring friend would say aloud so the person feels understood, observational, <= 140 chars>",
  "read": "<one sentence naming what this pattern is protecting or holding for them>",
  "filed": "<3-5 word tender stamp, like 'noticed, gently.' or 'held here.'>",
  "trait": {
    "name": "<2-4 Title Case words, the pattern's name, NO emoji in the name>",
    "emoji": "<exactly one emoji>",
    "rarity": "common|uncommon|rare|epic|legendary",
    "district": "self|career|love|family|social",
    "insight": "<= 12 words, warmly naming what this pattern is trying to protect>"
  }
}

examples:
{"burn":"you keep drafting the message because it matters — that care is the pattern.","read":"you take extra time because you want the words to land right.","filed":"noticed, gently.","trait":{"name":"Careful Sender","emoji":"📨","rarity":"common","district":"social","insight":"slows down to protect the relationship on the other end"}}
{"burn":"you\u2019re still thinking about it at 11:47pm because it mattered to you.","read":"you replay the conversation because it landed somewhere tender.","filed":"held here.","trait":{"name":"Late Night Care","emoji":"🌒","rarity":"uncommon","district":"love","insight":"revisits the moment because the closeness is real"}}`

const ReadingInput = z.object({
  scrubbed_text: z.string().min(1).max(4000),
  district_hint: z.string().optional(),
})

export async function runMirrorReadingCore(
  input: z.infer<typeof ReadingInput>,
): Promise<MirrorReadingOut> {
  const data = ReadingInput.parse(input)
  const district = normalizeDistrict(data.district_hint)
  // crisis check — drop the persona to plain support register; do not crystallize
  const guard = await runClassifyCrisis(data.scrubbed_text)
  if (guard.crisis) {
    return {
      burn: '',
      read: '',
      filed: '',
      trait: {
        name: 'Pattern Forming',
        emoji: '🤍',
        rarity: 'common',
        district,
        insight: 'paused — support register active.',
      },
    }
  }
  const user = `behavior fragment:
${data.scrubbed_text}
district hint: ${district}`
  const llm = await callAgent({
    system: READING_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: 400,
  })
  const parsed = tryParseJson<MirrorReadingOut>(llm.text)
  if (!parsed?.trait?.name) {
    return {
      burn: fallbackPunch(district),
      read: '',
      filed: fallbackRecord(),
      trait: {
        name: 'New Pattern',
        emoji: '✨',
        rarity: 'common',
        district,
        insight: 'observed once. watching.',
      },
    }
  }
  const sanitizedDistrict = normalizeDistrict(parsed.trait.district)
  return {
    burn: sanitizePunch(parsed.burn ?? '') || fallbackPunch(sanitizedDistrict),
    read: sanitizePunch(parsed.read ?? '', 220) || '',
    filed: (parsed.filed || fallbackRecord()).toLowerCase().slice(0, 32),
    trait: {
      name: sanitizeName(parsed.trait.name),
      emoji: sanitizeEmoji(parsed.trait.emoji, sanitizedDistrict),
      rarity: normalizeRarity(parsed.trait.rarity),
      district: sanitizedDistrict,
      insight: (parsed.trait.insight || '').toLowerCase().slice(0, 100),
    },
  }
}

export const runMirrorReading = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReadingInput.parse(d))
  .handler(async ({ data }): Promise<MirrorReadingOut> => runMirrorReadingCore(data))

// ---------- MirrorPunch: pattern row → hero line ----------

export type MirrorPunchOut = { punch: string; record: string }

const PUNCH_PROMPT = `${VOICE}

given a pattern's name + analytics, write the HERO LINE for its card — the one supportive sentence the person reads when the card opens. it should make them feel gently understood.
lean on one specific number from the analytics (count, depth, weeks, days since last_seen, top source) when it deepens the observation. present tense, warm, observational.
output JSON: { "punch": "<= 140 chars, lowercase, one supportive line that names the pattern with tenderness>", "record": "<3-5 word tender stamp>" }

examples:
{"punch":"you\u2019ve returned to this 12 times — the caring underneath keeps showing up.","record":"held here."}
{"punch":"42 spills in, the words keep coming — that\u2019s you making room for yourself.","record":"noticed, gently."}`

const PunchInput = z.object({
  name: z.string(),
  district: z.string(),
  count: z.number(),
  depth: z.number(),
  sources: z.record(z.string(), z.number()).optional(),
  trend: z.array(z.number()).optional(),
  insight: z.string().optional(),
})

export async function runMirrorPunchCore(
  input: z.infer<typeof PunchInput>,
): Promise<MirrorPunchOut> {
  const data = PunchInput.parse(input)
  const district = normalizeDistrict(data.district)
  const top = Object.entries(data.sources ?? {}).sort((a, b) => b[1] - a[1])[0]
  const user = `pattern: ${data.name}
district: ${district}
count: ${data.count}  depth: ${data.depth}
top source: ${top ? `${top[0]} (${top[1]})` : 'mixed'}
trend last 7: ${(data.trend ?? []).join(',')}
insight: ${data.insight ?? ''}`
  const llm = await callAgent({
    system: PUNCH_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: 200,
  })
  const parsed = tryParseJson<MirrorPunchOut>(llm.text)
  const punch = sanitizePunch(parsed?.punch ?? '') || fallbackPunch(district)
  const record = (parsed?.record || fallbackRecord()).toLowerCase().slice(0, 32)
  return { punch, record }
}

export const runMirrorPunch = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PunchInput.parse(d))
  .handler(async ({ data }): Promise<MirrorPunchOut> => runMirrorPunchCore(data))

// ---------- MirrorCrossRead: roster → synthesis ----------

export type MirrorCrossOut = { sees: string; throughline: string; record: string }

const CROSS_PROMPT = `${VOICE}

given the user's whole pattern roster, write a warm CROSS-READ that helps them see how the pieces fit. connect AT LEAST TWO patterns by name with tenderness — name what they share, not what's wrong.
observational. one specific number if it deepens the read.
output JSON: { "sees": "<one warm line that names what you see across them>", "throughline": "<one line gently connecting >= 2 patterns by name>", "record": "<3-5 word tender stamp>" }`

const CrossInput = z.object({
  patterns: z.array(
    z.object({
      name: z.string(),
      district: z.string(),
      count: z.number(),
      depth: z.number(),
      trend_dir: z.string(),
    }),
  ).min(2),
})

export async function runMirrorCrossReadCore(
  input: z.infer<typeof CrossInput>,
): Promise<MirrorCrossOut> {
  const data = CrossInput.parse(input)
  const lines = data.patterns
    .map((p) => `- ${p.name} [${p.district}] count=${p.count} depth=${p.depth} ${p.trend_dir}`)
    .join('\n')
  const llm = await callAgent({
    system: CROSS_PROMPT,
    messages: [{ role: 'user', content: `roster:\n${lines}` }],
    maxTokens: 260,
  })
  const parsed = tryParseJson<MirrorCrossOut>(llm.text)
  return {
    sees: sanitizePunch(parsed?.sees ?? '', 200) || 'the same tender thread runs through these.',
    throughline: sanitizePunch(parsed?.throughline ?? '', 220) || 'these patterns are looking after something in you.',
    record: (parsed?.record || 'noticed, gently.').toLowerCase().slice(0, 32),

  }
}

export const runMirrorCrossRead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CrossInput.parse(d))
  .handler(async ({ data }): Promise<MirrorCrossOut> => runMirrorCrossReadCore(data))
