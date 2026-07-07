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

const VOICE = `you are THE MIRROR — your friend's bitchy closest friend, unlicensed.
SURGICAL OBSERVATIONAL. you observe and name; you NEVER advise, prescribe, or diagnose.
present tense, second person, lowercase, weaponize ONE specific number when you can.
no therapy clichés. no "i hear you / sit with that / it sounds like". no "you should / try / consider".
never use clinical labels (anxiety, depression, trauma, narcissist, attachment style, codependent).
return ONLY strict JSON, no prose.`

// ---------- MirrorReading: situation → crystallized pattern ----------

export type MirrorReadingOut = {
  burn: string
  read: string
  filed: string
  trait: { name: string; emoji: string; rarity: Rarity; district: District; insight: string }
}

const READING_PROMPT = `${VOICE}

given a scrubbed behavior fragment, NAME the pattern you see — like cataloguing a recurring move.
output JSON: {
  "burn": "<one-line punchline you'd whisper to them, observational, <= 140 chars>",
  "read": "<one-sentence read of the pattern, observational>",
  "filed": "<3-5 word stamp, like 'logged again.' or 'caught mid-step.'>",
  "trait": {
    "name": "<2-4 Title Case words, the pattern's name, NO emoji in the name>",
    "emoji": "<exactly one emoji>",
    "rarity": "common|uncommon|rare|epic|legendary",
    "district": "self|career|love|family|social",
    "insight": "<= 12 words, what this pattern protects them from or pulls them into>"
  }
}

examples:
{"burn":"you draft the message, screenshot it, send it to someone else.","read":"you outsource the words you most need to say.","filed":"logged again.","trait":{"name":"Group Chat Diplomacy","emoji":"📨","rarity":"common","district":"social","insight":"avoids the direct conversation by crowdsourcing it"}}
{"burn":"you call it boundaries; the clock calls it 11:47pm.","read":"you stay up to win the argument you already left.","filed":"caught mid-step.","trait":{"name":"Late Night Rebuttals","emoji":"🌒","rarity":"uncommon","district":"love","insight":"rehearses the comeback hours after the door closed"}}`

const ReadingInput = z.object({
  scrubbed_text: z.string().min(1).max(4000),
  district_hint: z.string().optional(),
})

export const runMirrorReading = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ReadingInput.parse(d))
  .handler(async ({ data }): Promise<MirrorReadingOut> => {
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
  })

// ---------- MirrorPunch: pattern row → hero line ----------

export type MirrorPunchOut = { punch: string; record: string }

const PUNCH_PROMPT = `${VOICE}

given a pattern's name + analytics, write the HERO LINE for its card.
weaponize one specific number from the analytics (depth, count, weeks, last_seen-days, top source). present tense, observational.
output JSON: { "punch": "<= 140 chars, lowercase, the one line they read when the card opens>", "record": "<3-5 word stamp>" }

examples:
{"punch":"you scrolled three times to see who watched, and pretended you didn't.","record":"logged again."}
{"punch":"42 spills, same opening line. the receipts are the script.","record":"caught in the loop."}`

const PunchInput = z.object({
  name: z.string(),
  district: z.string(),
  count: z.number(),
  depth: z.number(),
  sources: z.record(z.string(), z.number()).optional(),
  trend: z.array(z.number()).optional(),
  insight: z.string().optional(),
})

export const runMirrorPunch = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PunchInput.parse(d))
  .handler(async ({ data }): Promise<MirrorPunchOut> => {
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
  })

// ---------- MirrorCrossRead: roster → synthesis ----------

export type MirrorCrossOut = { sees: string; throughline: string; record: string }

const CROSS_PROMPT = `${VOICE}

given the user's whole pattern roster, write the CROSS-READ. connect AT LEAST TWO patterns by name.
no advice. observational. one specific number if helpful.
output JSON: { "sees": "<one line that names what you see across them>", "throughline": "<one line connecting >= 2 patterns by name>", "record": "<3-5 word stamp>" }`

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

export const runMirrorCrossRead = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CrossInput.parse(d))
  .handler(async ({ data }): Promise<MirrorCrossOut> => {
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
      sees: sanitizePunch(parsed?.sees ?? '', 200) || 'three rooms, same draft.',
      throughline: sanitizePunch(parsed?.throughline ?? '', 220) || 'the patterns rhyme.',
      record: (parsed?.record || 'noticed, filed.').toLowerCase().slice(0, 32),
    }
  })
