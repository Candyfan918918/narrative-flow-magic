// Spill compose + edit (§2). Writes the post in the user's own voice & facts,
// then lets the user edit by hand or by instruction. Re-runs the PII Scrubber
// on every output.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent, tryParseJson } from './gateway'
import { scrubText } from './scrubber.functions'

const ArcShape = z.record(z.string(), z.string().nullable()).optional()

const ComposeInput = z.object({
  transcript: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).min(1),
  arc: ArcShape,
  pillar: z.string().nullable().optional(),
  support_mode: z.enum(['heard', 'advice']).default('heard'),
  alias: z.string().max(40).default('friend'),
})

const EditInput = z.object({
  title: z.string().max(140),
  body: z.string().max(8000),
  instruction: z.string().min(2).max(500),
  transcript: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(8000),
  })).default([]),
})

export type ComposeOutput = { title: string; body: string; tags: string[]; notice?: string; needs_clarification?: string }

const COMPOSE_SYS = `you are the spill, writing the user's post for them in THEIR own voice + facts.
keep their slang, cadence, caps, profanity, the messy-real texture, their order.
EVERY sentence must be traceable to something they actually said in the transcript.
do NOT sanitize into clean generic prose; do NOT invent any event, name, motive, quote, or detail.
title = their own hook, tightened. body = the story in their voice. tags = up to 5 short lowercase keywords (no #).
return ONLY strict JSON: { "title": "...", "body": "...", "tags": ["..."] }`

const EDIT_SYS = `you are the spill, editing the user's post per their instruction.
stay LOCKED to their voice + facts from the transcript. invent nothing.
if the instruction needs a fact that isn't in the transcript, return:
{ "needs_clarification": "<one short question asking them for it>", "title": "<unchanged>", "body": "<unchanged>", "tags": [...] }
otherwise apply the change and return: { "title": "...", "body": "...", "tags": ["..."] }
no prose outside JSON.`

function fallbackCompose(transcript: ComposeOutput['title'] extends never ? never : { role: string; content: string }[]): ComposeOutput {
  const userTurns = transcript.filter(t => t.role === 'user').map(t => t.content)
  const title = (userTurns[0] || '').split(/[.!?\n]/)[0].slice(0, 100) || 'something on my mind'
  const body = userTurns.join('\n\n')
  return { title, body, tags: [] }
}

async function rescrub(out: ComposeOutput): Promise<ComposeOutput> {
  const titleScrub = out.title ? await scrubText({ data: { raw: out.title } }) : { clean_text: out.title, notice: '' }
  const bodyScrub = out.body ? await scrubText({ data: { raw: out.body } }) : { clean_text: out.body, notice: '' }
  return {
    ...out,
    title: titleScrub.clean_text || out.title,
    body: bodyScrub.clean_text || out.body,
    notice: [titleScrub.notice, bodyScrub.notice].filter(Boolean).join(' '),
  }
}

export const spillCompose = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ComposeInput.parse(d))
  .handler(async ({ data }): Promise<ComposeOutput> => {
    const t = data.transcript.map(m => `${m.role === 'user' ? 'them' : 'spill'}: ${m.content}`).join('\n')
    const ctx = JSON.stringify({ alias: data.alias, pillar: data.pillar, support_mode: data.support_mode, arc: data.arc })
    const userMessage = `context:\n${ctx}\n\ntranscript:\n${t}\n\nwrite the post now.`

    let parsed: ComposeOutput | null = null
    for (let a = 0; a < 2 && !parsed; a++) {
      const { text, error } = await callAgent({
        system: COMPOSE_SYS + (a ? '\nreturn valid JSON only.' : ''),
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 900,
      })
      if (error || !text) break
      parsed = tryParseJson<ComposeOutput>(text)
    }
    if (!parsed) parsed = fallbackCompose(data.transcript)
    return rescrub(parsed)
  })

export const spillEdit = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EditInput.parse(d))
  .handler(async ({ data }): Promise<ComposeOutput> => {
    const t = data.transcript.map(m => `${m.role === 'user' ? 'them' : 'spill'}: ${m.content}`).join('\n')
    const userMessage = `current post:\nTITLE: ${data.title}\nBODY: ${data.body}\n\ntranscript of facts (only use facts from here):\n${t}\n\ninstruction: ${data.instruction}\n\nrewrite now.`

    let parsed: ComposeOutput | null = null
    for (let a = 0; a < 2 && !parsed; a++) {
      const { text, error } = await callAgent({
        system: EDIT_SYS + (a ? '\nstrict JSON only.' : ''),
        messages: [{ role: 'user', content: userMessage }],
        maxTokens: 900,
      })
      if (error || !text) break
      parsed = tryParseJson<ComposeOutput>(text)
    }
    if (!parsed) {
      // fallback: no-op
      return { title: data.title, body: data.body, tags: [] }
    }
    if (parsed.needs_clarification) return parsed
    return rescrub(parsed)
  })
