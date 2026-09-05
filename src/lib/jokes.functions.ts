// Joke cards — the landing surface's server side.
//
// Every rule that matters is enforced here, never in the browser:
//   · identity + tier resolved from the bearer token and the subscriptions table
//   · the daily flip counter incremented BEFORE any model call, so a crash
//     mid-generation cannot hand out a free flip
//   · guest flips return a card but write no joke_cards row
//   · signing in merges today's counter instead of minting a fresh allowance
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { runScrub } from './agents/scrubber.functions'
import { runClassifyCrisis } from './agents/guard.functions'
import { classifyArchetype, drawAngles, generateLine } from './jokes/deck.server'
import { resolveJokeIdentity, resolveDay, ipFlipLimit, ipSubjectKey } from './jokes/session.server'
import { ANGLE_LABEL, type JokeCard } from './jokes/deck'

const Ctx = {
  anon_session_id: z.string().max(64).nullable().optional(),
  // Accepted but DELIBERATELY IGNORED: the day comes from server-stored state
  // only, so a client cannot roll its own timezone to farm extra flips.
  timezone: z.string().max(64).nullable().optional(),
}

type FlipRow = {
  subject_key: string
  day: string
  flips_used: number
  sets_flipped: number
  set_ids: string[]
  grant_set_id?: string | null
  grant_position?: number | null
  grant_consumed?: boolean
}

async function readCounter(admin: any, subjectKey: string, day: string): Promise<FlipRow> {
  const { data } = await admin
    .from('joke_flips')
    .select('subject_key, day, flips_used, sets_flipped, set_ids, grant_set_id, grant_position, grant_consumed')
    .eq('subject_key', subjectKey)
    .eq('day', day)
    .maybeSingle()
  return (data as FlipRow | null) ?? { subject_key: subjectKey, day, flips_used: 0, sets_flipped: 0, set_ids: [] }
}

// ───────────────────────── 1 · entry ─────────────────────────

export type JokeEntryResult =
  | { crisis: true }
  | {
      crisis: false
      set_id: string
      clean_text: string
      archetype: string
      angles: string[]
      notice: string
      tier: 'guest' | 'free' | 'paying'
    }

export const submitJokeEntry = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ raw: z.string().min(1).max(4000), ...Ctx }).parse(d),
  )
  .handler(async ({ data }): Promise<JokeEntryResult> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const id = await resolveJokeIdentity(data.anon_session_id ?? null)

    // scrub first — the raw text is never stored
    const scrubbed = await runScrub(data.raw)
    const clean = scrubbed.clean_text

    // crisis overrides everything. no set, no cards, no paywall, no signup.
    const crisis = await runClassifyCrisis(clean)
    if (crisis.crisis) {
      await supabaseAdmin.from('crisis_events').insert({
        alias_id: id.userId,
        category: crisis.category,
        severity: crisis.severity,
        resources_shown: true,
      } as never)
      return { crisis: true }
    }

    const archetype = classifyArchetype(clean)
    const angles = drawAngles()

    const { data: row, error } = await supabaseAdmin
      .from('joke_sets')
      .insert({
        user_id: id.userId,
        anon_session_id: id.userId ? null : (data.anon_session_id ?? null),
        clean_text: clean,
        archetype,
        angles,
        is_seed: false,
        corpus_eligible: false,
      } as never)
      .select('id')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'could not open that set')

    return {
      crisis: false,
      set_id: row.id as string,
      clean_text: clean,
      archetype,
      angles,
      notice: scrubbed.notice ?? '',
      tier: id.tier,
    }
  })

// ───────────────────────── 2 · flip ─────────────────────────

export type FlipResult =
  | { ok: true; card: JokeCard; tier: 'guest' | 'free' | 'paying'; flips_used: number; sets_flipped: number }
  | { ok: false; reason: 'flip_limit' | 'not_found'; scope: 'day' | 'set'; tier: 'guest' | 'free' | 'paying' }
  | { ok: false; reason: 'rate_limited'; scope: 'network'; tier: 'guest' | 'free' | 'paying' }

export const flipJokeCard = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z.object({ set_id: z.string().uuid(), position: z.number().int().min(0).max(2), ...Ctx }).parse(d),
  )
  .handler(async ({ data }): Promise<FlipResult> => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const id = await resolveJokeIdentity(data.anon_session_id ?? null)
    const day = await resolveDay(supabaseAdmin, id.userId)

    // ── abuse layer, separate from the tier rules ──
    const ipKey = ipSubjectKey()
    if (ipKey) {
      const ipRow = await readCounter(supabaseAdmin, ipKey, day)
      if (ipRow.flips_used >= ipFlipLimit()) {
        return { ok: false, reason: 'rate_limited', scope: 'network', tier: id.tier }
      }
    }

    const { data: set } = await supabaseAdmin
      .from('joke_sets')
      .select('id, user_id, anon_session_id, clean_text, archetype, angles')
      .eq('id', data.set_id)
      .maybeSingle()
    if (!set) return { ok: false, reason: 'not_found', scope: 'set', tier: id.tier }

    // the set must belong to the caller (or to their guest session)
    const ownsIt = id.userId
      ? set.user_id === id.userId || (!set.user_id && set.anon_session_id === (data.anon_session_id ?? null))
      : !set.user_id && !!data.anon_session_id && set.anon_session_id === data.anon_session_id
    if (!ownsIt) return { ok: false, reason: 'not_found', scope: 'set', tier: id.tier }

    const angles = (set.angles as string[]) ?? []
    const angle = angles[data.position]
    if (!angle) return { ok: false, reason: 'not_found', scope: 'set', tier: id.tier }

    // double-tap / retry guard: a card already at this position is returned as-is
    // and never charges a second flip (joke_cards_set_position_key).
    if (id.userId) {
      const { data: existing } = await supabaseAdmin
        .from('joke_cards')
        .select('id, angle, card_text, position, used_fallback, judge_score')
        .eq('set_id', set.id)
        .eq('position', data.position)
        .maybeSingle()
      if (existing) {
        const prior = await readCounter(supabaseAdmin, id.subjectKey, day)
        return {
          ok: true,
          tier: id.tier,
          flips_used: prior.flips_used,
          sets_flipped: prior.sets_flipped,
          card: {
            id: existing.id as string,
            position: existing.position as number,
            angle: existing.angle as string,
            angleLabel: ANGLE_LABEL[existing.angle as string] ?? (existing.angle as string),
            text: existing.card_text as string,
            used_fallback: (existing.used_fallback as boolean) ?? false,
            judge_score: (existing.judge_score as number | null) ?? null,
            saved: true,
          },
        }
      }
    }

    // ── entitlement, resolved before any model call ──
    const counter = await readCounter(supabaseAdmin, id.subjectKey, day)
    const counted = counter.set_ids.includes(set.id as string)


    // A guest who flipped and then signed in to finish a second flip gets that
    // one flip and no more: the grant is tied to this exact pending action and
    // is consumed here, whatever the tier rules would otherwise say.
    const granted =
      counter.grant_consumed === false &&
      counter.grant_set_id === (set.id as string) &&
      counter.grant_position === data.position

    if (granted) {
      // fall through to generation, counting the flip
    } else if (id.tier === 'paying') {
      const { count: already } = await supabaseAdmin
        .from('joke_cards')
        .select('id', { count: 'exact', head: true })
        .eq('set_id', set.id)
      if ((already ?? 0) >= 3) return { ok: false, reason: 'flip_limit', scope: 'set', tier: id.tier }
      if (!counted && counter.sets_flipped >= 3) return { ok: false, reason: 'flip_limit', scope: 'day', tier: id.tier }
    } else if (counter.flips_used >= 1) {
      return { ok: false, reason: 'flip_limit', scope: 'day', tier: id.tier }
    }

    // ── increment FIRST, then generate ──
    const nextSetIds = counted ? counter.set_ids : [...counter.set_ids, set.id as string]
    await supabaseAdmin.from('joke_flips').upsert(
      {
        subject_key: id.subjectKey,
        day,
        flips_used: counter.flips_used + 1,
        sets_flipped: counted ? counter.sets_flipped : counter.sets_flipped + 1,
        set_ids: nextSetIds,
        grant_consumed: true,
        grant_set_id: null,
        grant_position: null,
      } as never,
      { onConflict: 'subject_key,day' },
    )
    if (ipKey) {
      const ipRow = await readCounter(supabaseAdmin, ipKey, day)
      await supabaseAdmin.from('joke_flips').upsert(
        { subject_key: ipKey, day, flips_used: ipRow.flips_used + 1, sets_flipped: 0, set_ids: [] } as never,
        { onConflict: 'subject_key,day' },
      )
    }

    const out = await generateLine({
      angle,
      archetype: (set.archetype as string) ?? 'general',
      situation: (set.clean_text as string) ?? '',
    })

    let cardId: string | null = null
    if (id.userId) {
      const { data: card } = await supabaseAdmin
        .from('joke_cards')
        .upsert(
          {
            set_id: set.id,
            user_id: id.userId,
            angle,
            card_text: out.text,
            position: data.position,
            used_fallback: out.used_fallback,
            judge_score: out.judge_score,
            is_seed: false,
            corpus_eligible: false,
          } as never,
          { onConflict: 'set_id,position', ignoreDuplicates: true },
        )
        .select('id')
        .maybeSingle()
      cardId = (card?.id as string) ?? null
      if (!cardId) {
        const { data: found } = await supabaseAdmin
          .from('joke_cards')
          .select('id')
          .eq('set_id', set.id)
          .eq('position', data.position)
          .maybeSingle()
        cardId = (found?.id as string) ?? null
      }

      void ingestJokeSignal(id.userId, set.id as string, out.text).catch(() => {})
    }

    return {
      ok: true,
      tier: id.tier,
      flips_used: counter.flips_used + 1,
      sets_flipped: counted ? counter.sets_flipped : counter.sets_flipped + 1,
      card: {
        id: cardId,
        position: data.position,
        angle,
        angleLabel: ANGLE_LABEL[angle] ?? angle,
        text: out.text,
        used_fallback: out.used_fallback,
        judge_score: out.judge_score,
        saved: !!cardId,
        day,
      },
    }
  })

// Mirror ingest — 🃏 Joke is its own shape, never folded into Spill.
async function ingestJokeSignal(userId: string, setId: string, text: string): Promise<void> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const { ingestMirrorSignal } = await import('./mirror-pipeline.functions')
  await ingestMirrorSignal({
    supabase: supabaseAdmin,
    userId,
    data: { source: 'joke', ref_id: setId, text },
  } as never)
}

// ───────────────────────── 3 · claim on sign-in ─────────────────────────

const ADJ = ['Quiet','Wistful','Defiant','Restless','Tender','Patient','Bitter','Forlorn','Tired','Honest','Careful','Steady','Wry','Stubborn','Gentle','Sharp']
const NAT = ['Filipino','Brazilian','Kenyan','Indian','Ethiopian','Pakistani','Moroccan','Chilean','Polish','Cuban','Vietnamese','Lebanese','Indonesian','Javanese','Peruvian','Greek']
const ANI: [string, string][] = [['Owl','🦉'],['Fox','🦊'],['Bear','🐻'],['Lion','🦁'],['Butterfly','🦋'],['Hedgehog','🦔'],['Swan','🦢'],['Heron','🕊'],['Wolf','🐺'],['Hawk','🦅'],['Crane','🦩'],['Fawn','🦌'],['Otter','🦦'],['Magpie','🐦'],['Deer','🦌'],['Ibis','🪿']]
const rand = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)]!

const HoldSchema = z
  .object({
    set_id: z.string().uuid(),
    position: z.number().int().min(0).max(2),
    angle: z.string().max(64),
    text: z.string().min(1).max(240),
    used_fallback: z.boolean().optional(),
    judge_score: z.number().nullable().optional(),
  })
  .nullable()
  .optional()

export const claimJokeSession = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) =>
    z
      .object({
        hold: HoldSchema,
        terms_version: z.string().max(32).optional(),
        // the flip that raised the sign-in sheet, if any — granted exactly once
        resume_flip: z
          .object({ set_id: z.string().uuid(), position: z.number().int().min(0).max(2) })
          .nullable()
          .optional(),
        ...Ctx,
      })
      .parse(d),
  )

  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const id = await resolveJokeIdentity(data.anon_session_id ?? null)
    if (!id.userId) throw new Error('sign in first')
    const userId = id.userId
    const day = await resolveDay(supabaseAdmin, userId)
    const anonKey = 'anon:' + (data.anon_session_id ?? 'unknown')

    // 1 · mint the pseudonym (only if this account has none yet)
    const { data: existing } = await supabaseAdmin
      .from('aliases')
      .select('user_id, display_name, emoji')
      .eq('user_id', userId)
      .maybeSingle()

    let alias = existing as { display_name: string; emoji: string } | null
    if (!alias) {
      for (let attempt = 0; attempt < 40; attempt++) {
        const [creature, emoji] = rand(ANI)
        const emotion = rand(ADJ), nation = rand(NAT)
        const display_name = `${emotion} ${nation} ${creature}`
        const { data: taken } = await supabaseAdmin
          .from('aliases')
          .select('user_id')
          .eq('display_name', display_name)
          .maybeSingle()
        if (taken) continue
        const { error } = await supabaseAdmin.from('aliases').insert({
          user_id: userId,
          emotion,
          nation,
          creature,
          emoji,
          display_name,
          birth_year: 1990,
          birth_month: 1,
          birth_day: 1,
          accepted_terms_version: data.terms_version ?? '2026-09-04',
          accepted_terms_at: new Date().toISOString(),
          accepted_privacy_version: data.terms_version ?? '2026-09-04',
          accepted_privacy_at: new Date().toISOString(),
        } as never)
        if (!error) { alias = { display_name, emoji }; break }
      }
    } else {
      await supabaseAdmin
        .from('aliases')
        .update({
          accepted_terms_version: data.terms_version ?? '2026-09-04',
          accepted_terms_at: new Date().toISOString(),
        } as never)
        .eq('user_id', userId)
    }

    // 2 · claim the guest session's sets
    if (data.anon_session_id) {
      await supabaseAdmin
        .from('joke_sets')
        .update({ user_id: userId, anon_session_id: null } as never)
        .eq('anon_session_id', data.anon_session_id)
        .is('user_id', null)
    }

    // 3 · merge today's flip counter — signing in never mints a fresh allowance
    const [anonRow, userRow] = await Promise.all([
      readCounter(supabaseAdmin, anonKey, day),
      readCounter(supabaseAdmin, 'user:' + userId, day),
    ])
    const mergedSetIds = Array.from(new Set([...userRow.set_ids, ...anonRow.set_ids]))
    const resume = data.resume_flip ?? null
    await supabaseAdmin.from('joke_flips').upsert(
      {
        subject_key: 'user:' + userId,
        day,
        flips_used: userRow.flips_used + anonRow.flips_used,
        sets_flipped: mergedSetIds.length,
        set_ids: mergedSetIds,
        // one-time grant, tied to the pending flip only
        grant_set_id: resume?.set_id ?? null,
        grant_position: resume ? resume.position : null,
        grant_consumed: !resume,
      } as never,
      { onConflict: 'subject_key,day' },
    )
    if (data.anon_session_id) {
      await supabaseAdmin.from('joke_flips').delete().eq('subject_key', anonKey)
    }

    // 4 · persist the card they were holding, and fire its memory signal
    let claimed: JokeCard | null = null
    if (data.hold) {
      const hold = data.hold
      const { data: dupe } = await supabaseAdmin
        .from('joke_cards')
        .select('id')
        .eq('set_id', hold.set_id)
        .eq('position', hold.position)
        .maybeSingle()
      if (!dupe) {
        const { data: card } = await supabaseAdmin
          .from('joke_cards')
          .upsert(
            {
              set_id: hold.set_id,
              user_id: userId,
              angle: hold.angle,
              card_text: hold.text,
              position: hold.position,
              used_fallback: hold.used_fallback ?? false,
              judge_score: hold.judge_score ?? null,
              is_seed: false,
              corpus_eligible: false,
            } as never,
            { onConflict: 'set_id,position', ignoreDuplicates: true },
          )
          .select('id')
          .maybeSingle()

        if (card) {
          claimed = {
            id: card.id as string,
            position: hold.position,
            angle: hold.angle,
            angleLabel: ANGLE_LABEL[hold.angle] ?? hold.angle,
            text: hold.text,
            used_fallback: hold.used_fallback ?? false,
            judge_score: hold.judge_score ?? null,
            saved: true,
            day,
          }
          void ingestJokeSignal(userId, hold.set_id, hold.text).catch(() => {})
        }
      }
    }

    return {
      tier: id.tier,
      alias: alias ? { display_name: alias.display_name, emoji: alias.emoji } : null,
      claimed,
    }
  })

// ───────────────────────── 4 · the set list ─────────────────────────

export const listMyJokeCards = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ ...Ctx }).parse(d ?? {}))
  .handler(async (): Promise<{ tier: 'guest' | 'free' | 'paying'; cards: JokeCard[] }> => {
    const id = await resolveJokeIdentity(null)
    if (!id.userId) return { tier: 'guest', cards: [] }
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data } = await supabaseAdmin
      .from('joke_cards')
      .select('id, angle, card_text, position, used_fallback, judge_score, room_id, created_at')
      .eq('user_id', id.userId)
      .order('created_at', { ascending: false })
      .limit(200)
    const cards: JokeCard[] = (data ?? []).map((r: any) => ({
      id: r.id as string,
      position: (r.position as number) ?? 0,
      angle: r.angle as string,
      angleLabel: ANGLE_LABEL[r.angle as string] ?? (r.angle as string),
      text: r.card_text as string,
      used_fallback: !!r.used_fallback,
      judge_score: (r.judge_score as number | null) ?? null,
      saved: true,
      room_id: (r.room_id as string | null) ?? null,
      day: String(r.created_at).slice(0, 10),
    }))
    return { tier: id.tier, cards }
  })

// ───────────────────────── 5 · post a card to a room ─────────────────────────

export const postJokeCardToRoom = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => z.object({ card_id: z.string().uuid(), ...Ctx }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const id = await resolveJokeIdentity(data.anon_session_id ?? null)
    if (!id.userId) throw new Error('sign in first')

    const { data: card } = await supabaseAdmin
      .from('joke_cards')
      .select('id, user_id, set_id, card_text, angle, room_id')
      .eq('id', data.card_id)
      .maybeSingle()
    if (!card || card.user_id !== id.userId) throw new Error('forbidden')
    if (card.room_id) return { room_id: card.room_id as string, already: true }

    const { data: alias } = await supabaseAdmin
      .from('aliases')
      .select('display_name, emoji')
      .eq('user_id', id.userId)
      .maybeSingle()

    const { data: set } = await supabaseAdmin
      .from('joke_sets')
      .select('clean_text')
      .eq('id', card.set_id)
      .maybeSingle()

    const title = String(card.card_text).slice(0, 90)
    const { data: situation, error: sitErr } = await supabaseAdmin
      .from('situations')
      .insert({
        alias_id: id.userId,
        pillar: 'family',
        clean_text: (set?.clean_text as string) ?? String(card.card_text),
        kind: 'joke',
        title,
        body: String(card.card_text),
        is_public: true,
        crisis_flag: false,
        is_seed: false,
        status: 'open',
      } as never)
      .select('id')
      .single()
    if (sitErr || !situation) throw new Error(sitErr?.message ?? 'could not open a room')

    const { data: room, error: roomErr } = await supabaseAdmin
      .from('rooms')
      .insert({
        author_id: id.userId,
        alias: (alias?.display_name as string) ?? 'someone',
        emoji: (alias?.emoji as string) ?? '🃏',
        title,
        body: String(card.card_text),
        support: 'heard',
        hall: 'relatable',
        source: 'joke',
      } as never)
      .select('id')
      .single()
    if (roomErr || !room) throw new Error(roomErr?.message ?? 'could not open a room')

    await supabaseAdmin.from('situations').update({ room_id: room.id } as never).eq('id', situation.id)
    await supabaseAdmin.from('joke_cards').update({ room_id: room.id } as never).eq('id', card.id)

    return {
      room_id: room.id as string,
      already: false,
      alias: (alias?.display_name as string) ?? 'someone',
    }
  })
