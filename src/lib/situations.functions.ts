// Content ownership server functions: situations (rooms / journals / scans) + comments.
// All authenticated; alias_id is always derived from auth.uid() via RLS.
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { requireRealUser } from './require-real-user'
import { runScrub } from './agents/scrubber.functions'

const Pillar = z.enum(['relationships', 'marriage', 'family', 'career'])
const Hall = z.enum(['healing', 'brave', 'relatable', 'loving'])

// ---------- list / get ----------

export const listMySituations = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('situations')
      .select(
        'id, pillar, clean_text, title, body, kind, initial_scan, scan_band, tags, is_public, room_id, status, edited, created_at, updated_at',
      )
      .eq('alias_id', context.userId)
      .neq('status', 'deleted')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const getSituation = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from('situations')
      .select('*')
      .eq('id', data.id)
      .single()
    if (error) throw new Error(error.message)
    return row
  })

// ---------- save (scan / journal / spill) ----------

const PILLAR_VALUES = ['relationships', 'marriage', 'family', 'career'] as const
const TolerantPillar = z.preprocess(
  (v) => (typeof v === 'string' && (PILLAR_VALUES as readonly string[]).includes(v) ? v : 'relationships'),
  z.enum(PILLAR_VALUES),
)
const OptionalTolerantPillar = z.preprocess(
  (v) => (v === undefined ? undefined : typeof v === 'string' && (PILLAR_VALUES as readonly string[]).includes(v) ? v : 'relationships'),
  z.enum(PILLAR_VALUES).optional(),
)

const SaveInput = z.object({
  kind: z.enum(['scan', 'spill']).nullable().optional(),
  pillar: TolerantPillar.default('relationships'),
  clean_text: z.string().max(8000).default(''),
  title: z.string().max(140).nullable().optional(),
  body: z.string().max(8000).nullable().optional(),
  tags: z.array(z.string().max(40)).max(12).default([]),
  initial_scan: z.number().int().min(0).max(999).nullable().optional(),
  scan_band: z.enum(['quiet', 'real', 'hot', 'heavy', 'serious']).nullable().optional(),
  is_public: z.boolean().default(false),
  support_mode: z.enum(['heard', 'advice']).nullable().optional(),
  emoji: z.string().max(8).optional(),
  alias: z.string().max(40).optional(),
})
type ScanBand = 'quiet' | 'real' | 'hot' | 'heavy' | 'serious'

export const saveSituation = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    // re-scrub text + body — dedupe when identical (spill flow sends the
    // same string in both fields), else run concurrently.
    const sameText = (data.body ?? '') === (data.clean_text ?? '')
    let cleanScrub: { clean_text: string; notice?: string }
    let bodyScrub: { clean_text: string; notice?: string }
    if (sameText) {
      const s = data.clean_text
        ? await runScrub(data.clean_text)
        : { clean_text: '', notice: '' }
      cleanScrub = s
      bodyScrub = data.body ? s : { clean_text: data.body ?? '', notice: '' }
    } else {
      const [c, b] = await Promise.all([
        data.clean_text ? runScrub(data.clean_text) : Promise.resolve({ clean_text: '', notice: '' }),
        data.body ? runScrub(data.body) : Promise.resolve({ clean_text: data.body ?? '', notice: '' }),
      ])
      cleanScrub = c
      bodyScrub = b
    }

    const insertRow = {
      alias_id: context.userId,
      pillar: data.pillar,
      clean_text: cleanScrub.clean_text || data.clean_text || '',
      title: data.title ?? null,
      body: bodyScrub.clean_text || data.body || null,
      kind: data.kind ?? null,
      tags: data.tags,
      initial_scan: data.initial_scan ?? null,
      scan_band: data.scan_band ?? null,
      is_public: data.is_public,
      support_mode: data.support_mode ?? null,
      status: 'open' as const,
    }

    const { data: sit, error } = await context.supabase
      .from('situations')
      .insert(insertRow)
      .select('id, is_public, room_id')
      .single()
    if (error || !sit) throw new Error(error?.message ?? 'save failed')

    // Run embedding + room creation concurrently — both only need sit.id
    // and are independent. Keep fail-soft semantics.
    const embedTask = (async () => {
      try {
        const { embedText, toVectorLiteral } = await import('./agents/embeddings.server')
        const vec = await embedText(insertRow.clean_text || insertRow.body || '')
        if (vec) {
          await context.supabase
            .from('situations')
            .update({ embedding: toVectorLiteral(vec) } as never)
            .eq('id', sit.id)
        }
      } catch { /* non-blocking */ }
    })()

    const roomTask = (async (): Promise<string | null> => {
      let roomId: string | null = sit.room_id
      if (data.is_public && !roomId) {
        const aliasRow = await context.supabase
          .from('aliases')
          .select('display_name, emoji')
          .eq('user_id', context.userId)
          .maybeSingle()
        const displayName = (aliasRow.data as { display_name?: string } | null)?.display_name ?? 'someone'
        const emoji = (aliasRow.data as { emoji?: string } | null)?.emoji ?? '🩷'
        roomId = await upsertRoomForSituation(context.supabase, sit.id, {
          author_id: context.userId,
          alias: displayName,
          emoji,
          title: data.title ?? deriveTitle(insertRow.body || insertRow.clean_text),
          body: insertRow.body || insertRow.clean_text,
          support: 'heard',
          hall: hallFromBand(data.scan_band),
        })
      }
      return roomId
    })()

    const [, roomId] = await Promise.all([embedTask, roomTask])

    // Mirror ingest — awaited so serverless doesn't kill the pending promise.
    try {
      const { runIngestMirrorEvent } = await import('@/lib/mirror-pipeline.functions')
      const pillar = data.pillar
      const district_hint =
        pillar === 'career' ? 'career'
          : pillar === 'family' ? 'family'
          : 'love'
      await runIngestMirrorEvent({
        supabase: context.supabase,
        userId: context.userId,
        data: {
          source: data.kind === 'scan' ? 'scan' : 'spill',
          ref_id: sit.id,
          raw_text: insertRow.clean_text || insertRow.body || '',
          district_hint,
        },
      })
    } catch (err) { console.error('[mirror-ingest] saveSituation', err) }

    return { id: sit.id, is_public: sit.is_public, room_id: roomId }
  })

// ---------- update / flip / delete ----------

const UpdateInput = z.object({
  id: z.string().uuid(),
  title: z.string().max(140).nullable().optional(),
  body: z.string().max(8000).nullable().optional(),
  clean_text: z.string().max(8000).optional(),
  pillar: OptionalTolerantPillar,
  tags: z.array(z.string().max(40)).max(12).optional(),
  is_public: z.boolean().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'avoided', 'worse', 'abandoned']).optional(),
})

export const updateSituation = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const current = await context.supabase
      .from('situations')
      .select('id, alias_id, is_public, room_id, title, body, clean_text, scan_band, pillar')
      .eq('id', data.id)
      .single()
    if (current.error || !current.data) throw new Error('not found')
    if (current.data.alias_id !== context.userId) throw new Error('forbidden')

    const patch: Record<string, unknown> = { edited: true }
    if (data.title !== undefined) patch.title = data.title
    if (data.pillar !== undefined) patch.pillar = data.pillar
    if (data.tags !== undefined) patch.tags = data.tags
    if (data.status !== undefined) patch.status = data.status
    if (data.body !== undefined && data.clean_text !== undefined && data.body === data.clean_text) {
      const s = data.body ? await runScrub(data.body) : { clean_text: '' }
      patch.body = s.clean_text || data.body || null
      patch.clean_text = s.clean_text || data.clean_text
    } else {
      if (data.body !== undefined) {
        const s = data.body ? await runScrub(data.body) : { clean_text: '' }
        patch.body = s.clean_text || data.body || null
      }
      if (data.clean_text !== undefined) {
        const s = await runScrub(data.clean_text)
        patch.clean_text = s.clean_text || data.clean_text
      }
    }
    if (data.is_public !== undefined) patch.is_public = data.is_public

    const { error: upErr } = await context.supabase
      .from('situations')
      .update(patch as never)
      .eq('id', data.id)
    if (upErr) throw new Error(upErr.message)

    const goingPublic = data.is_public === true && !current.data.is_public
    const goingPrivate = data.is_public === false && current.data.is_public

    let roomId = current.data.room_id as string | null
    if (goingPublic) {
      const aliasRow = await context.supabase
        .from('aliases')
        .select('display_name, emoji')
        .eq('user_id', context.userId)
        .maybeSingle()
      const displayName = (aliasRow.data as { display_name?: string } | null)?.display_name ?? 'someone'
      const emoji = (aliasRow.data as { emoji?: string } | null)?.emoji ?? '🩷'
      roomId = await upsertRoomForSituation(context.supabase, data.id, {
        author_id: context.userId,
        alias: displayName,
        emoji,
        title: (patch.title as string) ?? current.data.title ?? deriveTitle((patch.body as string) || current.data.body || current.data.clean_text),
        body: (patch.body as string) ?? current.data.body ?? current.data.clean_text,
        support: 'heard',
        hall: hallFromBand(current.data.scan_band as string | null),
      })
    } else if (goingPrivate && roomId) {
      await context.supabase.from('rooms').delete().eq('id', roomId).eq('author_id', context.userId)
      await context.supabase.from('situations').update({ room_id: null } as never).eq('id', data.id)
      await context.supabase.rpc('cancel_pending_checkins', { _situation_id: data.id })
      roomId = null
    } else if (roomId && (patch.title || patch.body)) {
      // sync edits into linked room
      const update: Record<string, unknown> = {}
      if (patch.title) update.title = patch.title
      if (patch.body) update.body = patch.body
      await context.supabase.from('rooms').update(update as never).eq('id', roomId).eq('author_id', context.userId)
    }
    return { id: data.id, is_public: data.is_public ?? current.data.is_public, room_id: roomId }
  })

export const deleteSituation = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: current } = await context.supabase
      .from('situations')
      .select('id, alias_id, room_id')
      .eq('id', data.id)
      .single()
    if (!current || current.alias_id !== context.userId) throw new Error('forbidden')
    await context.supabase
      .from('situations')
      .update({ status: 'deleted', deleted_at: new Date().toISOString(), is_public: false } as never)
      .eq('id', data.id)
    if (current.room_id) {
      await context.supabase.from('rooms').delete().eq('id', current.room_id).eq('author_id', context.userId)
    }
    await context.supabase.rpc('cancel_pending_checkins', { _situation_id: data.id })
    return { id: data.id, ok: true }
  })

// ---------- AI compose / edit ----------

const PERSONA = `You are the spill — a no-nonsense, warm friend the user just vented to.
Write in their OWN voice + facts: keep their slang, cadence, caps, profanity, the messy texture.
Every sentence must be traceable to something they actually said. NEVER invent events, names, motives, or quotes.
No therapy-speak. No em-dashes. No "I hear you / sit with that / that's valid / it sounds like".
Lowercase, short, real. Return ONLY strict JSON, no prose.`

export const composePost = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) =>
    z.object({ transcript: z.string().min(1).max(12000), pillar: Pillar.optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const prompt = `${PERSONA}

write a post FROM THIS PERSON'S vent below.
return JSON: { "title": "<their own hook tightened, <= 60 chars>", "body": "<the post, 2-6 short paragraphs, in their voice, traceable to what they said>", "tags": ["<= 4 short tags, all lowercase>"] }

--- their vent ---
${data.transcript}
--- end ---`
    const text = await callAI(prompt)
    const parsed = tryParseJson<{ title: string; body: string; tags: string[] }>(text)
    if (!parsed || !parsed.body) {
      // graceful fallback: use the transcript verbatim
      return {
        title: deriveTitle(data.transcript),
        body: data.transcript,
        tags: [] as string[],
      }
    }
    // re-scrub
    const s = await runScrub(parsed.body)
    return {
      title: parsed.title?.slice(0, 140) ?? deriveTitle(parsed.body),
      body: s.clean_text || parsed.body,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    }
  })

export const aiEditPost = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        currentTitle: z.string().max(140).optional(),
        currentBody: z.string().min(1).max(12000),
        instruction: z.string().min(1).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const prompt = `${PERSONA}

the user wrote this post:
TITLE: ${data.currentTitle ?? ''}
BODY:
${data.currentBody}

they want this change: "${data.instruction}"

rewrite the post in their voice. invent NOTHING. if the change needs a fact that isn't here, set "needs_info" to a short question instead of rewriting.
return JSON: { "title": "...", "body": "...", "needs_info": "<question>|null" }`
    const text = await callAI(prompt)
    const parsed = tryParseJson<{ title: string; body: string; needs_info: string | null }>(text)
    if (!parsed) return { title: data.currentTitle ?? '', body: data.currentBody, needs_info: null }
    if (parsed.needs_info) {
      return { title: data.currentTitle ?? '', body: data.currentBody, needs_info: parsed.needs_info }
    }
    const s = await runScrub(parsed.body)
    return {
      title: parsed.title?.slice(0, 140) ?? data.currentTitle ?? '',
      body: s.clean_text || parsed.body,
      needs_info: null as string | null,
    }
  })

// ---------- comments (owned) ----------

export const listRoomComments = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ roomId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from('comments')
      .select('id, alias_id, clean_text, edited, created_at')
      .eq('room_id', data.roomId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(200)
    if (error) throw new Error(error.message)
    return rows ?? []
  })

export const createComment = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) =>
    z.object({ roomId: z.string().uuid(), text: z.string().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const s = await runScrub(data.text)
    const { data: row, error } = await context.supabase
      .from('comments')
      .insert({
        room_id: data.roomId,
        alias_id: context.userId,
        clean_text: s.clean_text || data.text,
      })
      .select('id, alias_id, clean_text, edited, created_at')
      .single()
    if (error) throw new Error(error.message)

    // SLA tracking: stamp human_response_at on the situation the first time
    // a non-author leaves a comment. Drives the relate-queue and the
    // time-to-first-human-response metric (§7.6).
    try {
      const { data: sit } = await context.supabase
        .from('situations')
        .select('id, alias_id, human_response_at')
        .eq('room_id', data.roomId)
        .maybeSingle()
      if (sit && !sit.human_response_at && sit.alias_id !== context.userId) {
        await context.supabase
          .from('situations')
          .update({ human_response_at: new Date().toISOString() } as never)
          .eq('id', sit.id)
      }
    } catch { /* non-blocking */ }

    // Mirror ingest — a comment IS a behavior signal (awaited).
    try {
      if (row?.id) {
        const { runIngestMirrorEvent } = await import('@/lib/mirror-pipeline.functions')
        await runIngestMirrorEvent({
          supabase: context.supabase,
          userId: context.userId,
          data: {
            source: 'comments',
            ref_id: row.id as string,
            raw_text: (row as { clean_text: string }).clean_text ?? '',
            district_hint: 'social',
          },
        })
      }
    } catch (err) { console.error('[mirror-ingest] createComment', err) }
    return row
  })

export const updateComment = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), text: z.string().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const s = await runScrub(data.text)
    const { error } = await context.supabase
      .from('comments')
      .update({ clean_text: s.clean_text || data.text, edited: true } as never)
      .eq('id', data.id)
      .eq('alias_id', context.userId)
    if (error) throw new Error(error.message)
    return { id: data.id, ok: true }
  })

export const deleteComment = createServerFn({ method: 'POST' })
  .middleware([requireRealUser])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', data.id)
      .eq('alias_id', context.userId)
    if (error) throw new Error(error.message)
    return { id: data.id, ok: true }
  })

// ---------- helpers ----------

type AnySupabase = {
  from: (t: string) => {
    upsert: (rows: unknown, opts?: unknown) => { select: (cols: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } }
    update: (patch: unknown) => { eq: (k: string, v: unknown) => { eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }> } }
  }
}

async function upsertRoomForSituation(
  supabase: unknown,
  situationId: string,
  payload: {
    author_id: string
    alias: string
    emoji: string
    title: string
    body: string
    support: 'heard' | 'advice'
    hall: 'healing' | 'brave' | 'relatable' | 'loving'
  },
): Promise<string> {
  // Use plain supabase reference; the auth-middleware injects a user-scoped client.
  const sb = supabase as {
    from: (t: string) => {
      insert: (r: unknown) => { select: (c: string) => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } }
      update: (r: unknown) => { eq: (k: string, v: unknown) => Promise<{ error: { message: string } | null }> }
    }
  }
  const { data: room, error } = await sb
    .from('rooms')
    .insert(payload as never)
    .select('id')
    .single()
  if (error || !room) throw new Error(error?.message ?? 'room insert failed')
  await sb.from('situations').update({ room_id: room.id, is_public: true } as never).eq('id', situationId)
  return room.id
}

function hallFromBand(band: string | null | undefined): 'healing' | 'brave' | 'relatable' | 'loving' {
  switch (band) {
    case 'serious':
    case 'heavy':
      return 'brave'
    case 'hot':
      return 'relatable'
    case 'quiet':
      return 'loving'
    default:
      return 'healing'
  }
}

function deriveTitle(text: string): string {
  const first = (text || '').split(/[.\n!?]/)[0]?.trim() || 'untitled'
  return first.length > 60 ? first.slice(0, 57) + '…' : first
}

async function callAI(prompt: string): Promise<string> {
  const url = process.env.LOVABLE_API_KEY ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : ''
  if (!url) return ''
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Lovable-API-Key': process.env.LOVABLE_API_KEY!,
        'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
      },
      body: JSON.stringify({
        model: process.env.LOVABLE_AI_MODEL || 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!r.ok) return ''
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] }
    return j.choices?.[0]?.message?.content ?? ''
  } catch {
    return ''
  }
}

function tryParseJson<T>(text: string): T | null {
  if (!text) return null
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  try {
    return JSON.parse(stripped) as T
  } catch {
    // try to find a {...} block
    const m = stripped.match(/\{[\s\S]*\}/)
    if (!m) return null
    try {
      return JSON.parse(m[0]) as T
    } catch {
      return null
    }
  }
}
