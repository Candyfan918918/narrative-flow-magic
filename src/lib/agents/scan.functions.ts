// THE SCAN — measures the SITUATION against social norms (0-999).
// Not felt intensity, not blame, not verdict. High = unusual AND unjustified.
// One-shot version used by the Spill orchestrator; ScanModal runs the
// adaptive multi-turn flow.
import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'
import { callAgent, tryParseJson } from './gateway'

export type ScanBand = 'within' | 'uncommon' | 'outside' | 'well_outside' | 'far_outside'
export type DbScanBand = 'quiet' | 'real' | 'hot' | 'heavy' | 'serious'

export const bandLabel: Record<ScanBand, string> = {
  within: 'within normal',
  uncommon: 'uncommon',
  outside: 'outside normal',
  well_outside: 'well outside normal',
  far_outside: 'far outside normal',
}
export const bandToDb: Record<ScanBand, DbScanBand> = {
  within: 'quiet',
  uncommon: 'real',
  outside: 'hot',
  well_outside: 'heavy',
  far_outside: 'serious',
}

export type ScanReasoning = {
  norm_distance?: string
  justification?: string
  boundary?: string
  stakes?: string
  pattern?: string
  power_consent?: string
}

export type ScanResult = {
  scan: number
  band: ScanBand
  reflection: string
  reasoning?: ScanReasoning
  basis: 'model_prior'
  corpus_n: null
  cultural_note: string | null
}

const SCAN_PROMPT = `You are THE SCAN on Shutap. You read a SITUATION against social norms and answer ONE question: "how far outside normal is what happened, and how much should it concern them?" Scored 0-999. You are NOT measuring how heavy it FEELS to them — feelings are only one input. You never say who's right or wrong (no AITA, no verdict, no blame). You never score a PERSON, only the situation. Lowercase, warm, plain.

SCORE RISES WITH: norm_distance (how many people in their context would find this outside normal — the primary driver) × unjustification (was a legitimate proportionate reason given? this is the STRONGEST discount) × boundary crossing (personal / bodily / relational / privacy) × stakes (what's at risk + reversibility) × pattern (one-off / repeated / ongoing) × power_consent (could they say no? was consent possible?). A high score REQUIRES unusual AND unjustified. Unusual-but-justified stays LOW.

CALIBRATION ANCHORS (bake these in):
- Mother-in-law sleeps in same bed as your husband, ongoing, no reason given: ~850 (far outside normal).
- Customer doesn't tip after genuinely bad service: ~150 (within normal — clear proportionate justification collapses it).
- Partner reads your phone once after a fight: ~450 (moderate, weak justification, privacy boundary, one-off).
- Boss texts at 11pm about work every night: ~600 (moderate, no justification, time/rest boundary, ongoing).
Unusual ALONE is never high. Justification is the strongest single modifier.

Return ONLY strict JSON, no prose, no fences:
{
  "score": <0-999>,
  "band": "within normal|uncommon|outside normal|well outside normal|far outside normal",
  "signature": "<3-4 word Title Case>",
  "read": "<2 sentences naming WHAT makes this unusual and what (if anything) justifies it. observation only. never advice, never a verdict on a person.>",
  "reasoning": {
    "norm_distance": "<one line + 0-100>",
    "justification": "<what was offered, or 'none', + 0-100 discount>",
    "boundary": "<which boundary, or 'none'>",
    "stakes": "<concrete>",
    "pattern": "one_off|repeated|ongoing",
    "power_consent": "<could they say no?>"
  },
  "factors": ["<2-4 word driver>", "..."],
  "basis": "model_prior",
  "corpus_n": null,
  "cultural_note": "<null, or one line acknowledging norms differ by context>"
}

BANS: no advice tokens (you should / try / consider / recommend); no clinical labels; no verdict on a person; no fabricated numbers ("312 people said…" — corpus_n is ALWAYS null for now). Read is observation only. Norms are cultural: use "most people in your context", never objective moral claim. Never reference a real name/place; use the scrubbed referents as given.`

export function bandFor(score: number): ScanBand {
  if (score < 200) return 'within'
  if (score < 400) return 'uncommon'
  if (score < 600) return 'outside'
  if (score < 800) return 'well_outside'
  return 'far_outside'
}

function phraseToBand(s: string | undefined): ScanBand | null {
  if (!s) return null
  const t = s.toLowerCase().trim()
  if (t.startsWith('within')) return 'within'
  if (t.startsWith('uncommon')) return 'uncommon'
  if (t.startsWith('well')) return 'well_outside'
  if (t.startsWith('far')) return 'far_outside'
  if (t.startsWith('outside')) return 'outside'
  return null
}

function deterministicScan(text: string, pillar: string): ScanResult {
  // Neutral cold-start fallback. No feeling-based scoring — this is a
  // norm-distance measure, and without the LLM we can't reason about
  // justification. Pick a mid-band placeholder and be honest about it.
  const len = text.length
  let score = 300
  score += Math.min(200, Math.floor(len / 8))
  const lower = text.toLowerCase()
  if (/(every day|every night|always|constantly|keeps|again)/.test(lower)) score += 80 // pattern
  if (/(without asking|didn't ask|no reason|didn't say why|refused to explain)/.test(lower)) score += 120 // unjustified
  if (/(bathroom|bedroom|phone|password|body|touched)/.test(lower)) score += 60 // boundary
  if (pillar === 'marriage' || pillar === 'family') score += 20
  score = Math.max(0, Math.min(999, score))
  const band = bandFor(score)
  return {
    scan: score,
    band,
    reflection: 'no read yet — needs more of what actually happened.',
    basis: 'model_prior',
    corpus_n: null,
    cultural_note: null,
  }
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
      maxTokens: 500,
    })
    const parsed = tryParseJson<{
      score?: number
      band?: string
      signature?: string
      read?: string
      reasoning?: ScanReasoning
      cultural_note?: string | null
    }>(llm.text)
    if (parsed && typeof parsed.score === 'number') {
      const scan = Math.max(0, Math.min(999, Math.round(parsed.score)))
      const band = phraseToBand(parsed.band) ?? bandFor(scan)
      return {
        scan,
        band,
        reflection: parsed.read || deterministicScan(data.clean_text, data.pillar).reflection,
        reasoning: parsed.reasoning,
        basis: 'model_prior',
        corpus_n: null,
        cultural_note: parsed.cultural_note ?? null,
      }
    }
    return deterministicScan(data.clean_text, data.pillar)
  })
