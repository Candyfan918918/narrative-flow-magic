// Mirror "shape of you" (§6 + §14). Deterministic fallback from trend+pillar,
// then AI personalization with movement vs the previous reading. Persists each
// reading with capped history so progress is real.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent, tryParseJson } from './gateway'

const ShapeInput = z.object({
  alias: z.string().max(40).default('friend'),
  entries: z.number().int().min(0).default(0),
  spills: z.number().int().min(0).default(0),
  scans: z.number().int().min(0).default(0),
  days_active: z.number().int().min(0).default(0),
  days_since: z.number().int().min(0).default(0),
  top_pillar: z.string().nullable().optional(),
  latest_score: z.number().int().min(0).max(999).nullable().optional(),
  trend: z.enum(['easing', 'rising', 'steady', 'forming']).default('forming'),
  outcomes: z.object({ better: z.number(), same: z.number(), worse: z.number() }).partial().optional(),
  behavioral: z.object({
    visits: z.number().optional(),
    top_action: z.string().nullable().optional(),
    sentiment: z.number().nullable().optional(),
    dwell: z.number().optional(),
    last_question: z.string().nullable().optional(),
    events_total: z.number().optional(),
  }).partial().optional(),
})

export type ShapeReading = { shape: string; line: string; movement: string }

const SYS = `you are the mirror. tender, slower, specific.
from the signals, name the SHAPE the user is in right now — who they're becoming.
if a previous reading exists, name the MOVEMENT between then and now so it feels like real progress (softening, steadying, growing braver). never invent.
lowercase. never clinical. never advice.
return ONLY strict JSON:
{ "shape":"<2–4 word identity, lowercase>",
  "line":"<one short clause, ≤8 words, no trailing period>",
  "movement":"<≤14 words on shift vs previous reading, or \"\" if none>" }`

const PILLAR_SHAPES: Record<string, string> = {
  relationships: 'a tender defender',
  marriage: 'the long-loving one',
  family: 'the loyal one',
  career: 'the quiet workhorse',
  self: 'someone turning inward',
  other: 'still drawing the outline',
}

function deterministic(input: z.infer<typeof ShapeInput>): ShapeReading {
  if (input.entries < 2) {
    return { shape: 'still taking shape', line: "pour in a little more and i'll see you", movement: '' }
  }
  const base = PILLAR_SHAPES[input.top_pillar || 'other'] || 'still drawing the outline'
  let line = 'finding your own ground'
  if (input.trend === 'easing') line = 'something is softening'
  else if (input.trend === 'rising') line = 'it has been getting louder'
  else if (input.trend === 'steady') line = 'you have been holding'
  return { shape: base, line, movement: '' }
}

export const mirrorShape = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ShapeInput.parse(d))
  .handler(async ({ data, context }): Promise<{ reading: ShapeReading; fallback: ShapeReading; previous: ShapeReading | null }> => {
    const fallback = deterministic(data)
    if (data.entries < 2) {
      return { reading: fallback, fallback, previous: null }
    }

    // pull previous reading
    const prev = await context.supabase
      .from('mirror_shape')
      .select('shape, line, movement, history')
      .eq('user_id', context.userId)
      .maybeSingle()

    const previous: ShapeReading | null = prev.data
      ? { shape: prev.data.shape, line: prev.data.line, movement: prev.data.movement }
      : null

    const ctx = JSON.stringify({ ...data, previous })
    let parsed: ShapeReading | null = null
    for (let a = 0; a < 2 && !parsed; a++) {
      const { text, error } = await callAgent({
        system: SYS + (a ? '\nstrict JSON only.' : ''),
        messages: [{ role: 'user', content: `signals:\n${ctx}\n\nreturn the reading.` }],
        maxTokens: 200,
      })
      if (error || !text) break
      const raw = tryParseJson<ShapeReading>(text)
      if (raw && raw.shape) {
        parsed = {
          shape: String(raw.shape).slice(0, 60).toLowerCase(),
          line: String(raw.line || '').slice(0, 80),
          movement: String(raw.movement || '').slice(0, 120),
        }
      }
    }
    const reading = parsed || fallback

    // Persist (upsert, cap history to 10).
    try {
      const history = Array.isArray(prev.data?.history) ? prev.data!.history as Array<Record<string, unknown>> : []
      const nextHistory = previous
        ? [...history, { shape: previous.shape, line: previous.line, at: new Date().toISOString() }].slice(-10)
        : history
      await context.supabase
        .from('mirror_shape')
        .upsert({
          user_id: context.userId,
          shape: reading.shape,
          line: reading.line,
          movement: reading.movement,
          at: new Date().toISOString(),
          history: nextHistory as never,
        } as never, { onConflict: 'user_id' })
    } catch { /* non-blocking */ }

    return { reading, fallback, previous }
  })
