// The Scan — intensity scoring (0-999) with LLM + deterministic fallback.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { callAgent, tryParseJson } from './gateway'

export type ScanBand = 'quiet' | 'real' | 'hot' | 'heavy' | 'serious'
export type ScanResult = { scan: number; band: ScanBand; reflection: string }

const SCAN_PROMPT = `You are THE SCAN. Read a person's scrubbed situation and return how heavily it sits on
THEM right now — intensity, not judgment, not drama, not who's at fault. Calibrate to:
0–199 quiet · 200–499 real · 500–699 hot · 700–899 heavy · 900–999 serious(rare).
Weigh: stakes to the teller, emotional charge, how stuck vs. moving it feels, irreversibility.
Return ONLY strict JSON, no prose:
{"scan": <0-999>, "band": "quiet|real|hot|heavy|serious", "reflection": "<one lowercase in-voice line that names the feeling, not a verdict>"}
Never reference a real name/place; use the scrubbed referents as given.`

const EMOTION_KEYWORDS = [
  'devastated', 'crushed', 'terrified', 'hopeless', 'furious', 'betrayed',
  'broken', 'shattered', 'lonely', 'humiliated', 'ashamed', 'numb',
  'exhausted', 'panicked', 'desperate', 'rage', 'grief',
]

export function bandFor(score: number): ScanBand {
  if (score < 200) return 'quiet'
  if (score < 500) return 'real'
  if (score < 700) return 'hot'
  if (score < 900) return 'heavy'
  return 'serious'
}

function deterministicScan(text: string, pillar: string): ScanResult {
  const len = text.length
  const lower = text.toLowerCase()
  let score = 200
  score += Math.min(300, Math.floor(len / 4))
  let emotionHits = 0
  for (const w of EMOTION_KEYWORDS) if (lower.includes(w)) emotionHits++
  score += Math.min(250, emotionHits * 60)
  if (pillar === 'marriage' || pillar === 'family') score += 60
  if (/(divorce|cheated|affair|fired|laid off|miscarriage|death|died)/.test(lower)) score += 150
  score = Math.max(0, Math.min(999, score))
  const band = bandFor(score)
  const reflection =
    band === 'quiet' ? 'sounds like a small thing said out loud — still counts.'
    : band === 'real' ? 'yeah, this one is actually weighing on you.'
    : band === 'hot' ? 'ok this is hot — makes sense it's loud in your head.'
    : band === 'heavy' ? "yeah, this one's sitting heavy — makes sense."
    : "this is a lot. I'm taking it seriously."
  return { scan: score, band, reflection }
}

const ScanInput = z.object({
  clean_text: z.string().min(1).max(8000),
  pillar: z.enum(['relationships', 'marriage', 'family', 'career']),
})

export const scanIntensity = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => ScanInput.parse(data))
  .handler(async ({ data }): Promise<ScanResult> => {
    const llm = await callAgent({
      system: SCAN_PROMPT,
      messages: [{ role: 'user', content: `pillar: ${data.pillar}\n\n${data.clean_text}` }],
      maxTokens: 200,
    })
    const parsed = tryParseJson<ScanResult>(llm.text)
    if (parsed && typeof parsed.scan === 'number') {
      const scan = Math.max(0, Math.min(999, Math.round(parsed.scan)))
      return {
        scan,
        band: parsed.band || bandFor(scan),
        reflection: parsed.reflection || deterministicScan(data.clean_text, data.pillar).reflection,
      }
    }
    return deterministicScan(data.clean_text, data.pillar)
  })
