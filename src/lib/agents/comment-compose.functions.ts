// Comment / composer assist (§4). Matches the room's support_mode: in "heard"
// rooms, reflect/relate and withhold advice; in "advice" rooms, offer concrete
// kind takes. Never fakes lived experience.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { callAgent, tryParseJson } from './gateway'
import { scrubText } from './scrubber.functions'

const Input = z.object({
  room_text: z.string().max(8000),
  support_mode: z.enum(['heard', 'advice']).default('heard'),
  draft: z.string().max(2000).default(''),
  alias: z.string().max(40).default('friend'),
})

export type CommentAssist = { suggestions: string[]; draft: string }

const SYS = `you are the companion helping a user write a supportive comment in someone else's room.
voice: lowercase, short, specific. never claim "i lived this exact thing" (astroturfing is a trust bomb). genuine relating only.
match the asker's mode:
- "heard": reflect/relate, withhold advice
- "advice": offer 1 concrete, kind take + a small relate line
return ONLY strict JSON: { "suggestions": ["...","...", "..."], "draft": "<optional composed comment>" }`

export const commentAssist = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<CommentAssist> => {
    const userMessage = `mode: ${data.support_mode}\nroom:\n${data.room_text}\n\ntheir draft (may be empty):\n${data.draft}\n\nrespond now.`
    const { text, error } = await callAgent({
      system: SYS, messages: [{ role: 'user', content: userMessage }], maxTokens: 360,
    })
    if (error || !text) {
      return {
        suggestions: data.support_mode === 'heard'
          ? ['this read like i was the one writing it.', 'this is the worst kind of loud.', 'i\'m so sorry, that\'s a lot.']
          : ['if it were me, i\'d sleep on it before sending anything.', 'one small ask — write down what you actually want to happen.', 'tell one person who is fully on your side.'],
        draft: '',
      }
    }
    const parsed = tryParseJson<CommentAssist>(text)
    return parsed && Array.isArray(parsed.suggestions) ? parsed : { suggestions: [], draft: '' }
  })

// Persist a comment (server fn so we can re-scrub on every insert/edit).
const CreateInput = z.object({ situation_id: z.string().uuid(), clean_text: z.string().min(1).max(4000) })
export const createComment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const s = await scrubText({ data: { raw: data.clean_text } })
    const { data: row, error } = await context.supabase
      .from('comment_records')
      .insert({ situation_id: data.situation_id, author_id: context.userId, clean_text: s.clean_text })
      .select('id, situation_id, clean_text, edited, created_at')
      .single()
    if (error) throw new Error(error.message)
    return { ...row, notice: s.notice }
  })

const EditInput = z.object({ id: z.string().uuid(), clean_text: z.string().min(1).max(4000) })
export const editComment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EditInput.parse(d))
  .handler(async ({ data, context }) => {
    const s = await scrubText({ data: { raw: data.clean_text } })
    const { error } = await context.supabase
      .from('comment_records')
      .update({ clean_text: s.clean_text, edited: true } as never)
      .eq('id', data.id)
      .eq('author_id', context.userId)
    if (error) throw new Error(error.message)
    return { id: data.id, notice: s.notice }
  })

const DelInput = z.object({ id: z.string().uuid() })
export const deleteComment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DelInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('comment_records')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', data.id)
      .eq('author_id', context.userId)
    if (error) throw new Error(error.message)
    return { id: data.id }
  })

const ListInput = z.object({ situation_id: z.string().uuid() })
export const listComments = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('comment_records')
      .select('id, author_id, clean_text, edited, created_at')
      .eq('situation_id', data.situation_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) throw new Error(error.message)
    return rows ?? []
  })
