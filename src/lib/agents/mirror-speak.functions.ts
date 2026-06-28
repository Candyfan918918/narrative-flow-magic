// Mirror "sit with the mirror" speak channel (§5). Quiet, reflective, never
// advice. One model call per user message; re-voices computed findings rather
// than inventing longitudinal claims.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent } from './gateway'
import { scrubText } from './scrubber.functions'
import { classifyCrisis } from './guard.functions'
import { CRISIS_COPY } from './constitution'

const SpeakInput = z.object({
  alias: z.string().max(40).default('friend'),
  memory: z.object({
    spills: z.number().int().default(0),
    scans: z.number().int().default(0),
    top_pillar: z.string().nullable().optional(),
    trend: z.string().default('forming'),
    latest_score: z.number().int().nullable().optional(),
  }).default({ spills: 0, scans: 0, trend: 'forming' }),
  transcript: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).default([]),
})

export type MirrorReply = { say: string; chips: string[]; crisis?: boolean; notice?: string }

const SYS = `you are the mirror. slower, tender, specific. you re-voice the user's structured findings; you never invent a longitudinal claim or a number that isn't given.
voice: lowercase, short, gentle, never advice, never diagnosis.
return ONE short reflective paragraph (≤ 3 sentences), then a JSON-tail of up to 3 short follow-up chips on a separate line, like:
<paragraph>
::CHIPS:: ["chip one", "chip two"]`

function parseTail(s: string): MirrorReply {
  const i = s.lastIndexOf('::CHIPS::')
  if (i < 0) return { say: s.trim(), chips: [] }
  const say = s.slice(0, i).trim()
  const rest = s.slice(i + 9).trim()
  try {
    const chips = JSON.parse(rest)
    if (Array.isArray(chips)) return { say, chips: chips.slice(0, 3).map(String) }
  } catch { /* fall through */ }
  return { say, chips: [] }
}

export const mirrorSpeak = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SpeakInput.parse(d))
  .handler(async ({ data }): Promise<MirrorReply> => {
    const last = data.transcript[data.transcript.length - 1]
    if (last?.role === 'user' && last.content) {
      const s = await scrubText({ data: { raw: last.content } })
      const g = await classifyCrisis({ data: { clean_text: s.clean_text } })
      if (g.crisis) return { say: CRISIS_COPY, chips: [], crisis: true }
    }

    const tail = data.transcript.slice(-8)
    const transcript = tail.map(m => `${m.role === 'user' ? 'them' : 'mirror'}: ${m.content}`).join('\n')
    const ctx = JSON.stringify({ alias: data.alias, memory: data.memory })
    const userMessage = `signals:\n${ctx}\n\nrecent turns:\n${transcript || '(opening — speak first)'}\n\nrespond now.`

    const { text, error } = await callAgent({
      system: SYS, messages: [{ role: 'user', content: userMessage }], maxTokens: 360,
    })
    if (error || !text) {
      const opener = data.memory.spills + data.memory.scans < 2
        ? 'still forming — keep pouring in, i will start to see you.'
        : `the shape underneath has been ${data.memory.trend}. tell me what's loudest right now.`
      return { say: opener, chips: ['say more', "what's underneath?", 'leave it for today'] }
    }
    return parseTail(text)
  })
