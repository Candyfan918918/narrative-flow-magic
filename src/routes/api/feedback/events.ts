import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const LOVE = new Set([
  'relate','react','share_accept','scan_done','spill_publish','mirror_open',
  'mirror_reading','mirror_unlock','comment_post','room_dwell_long','return_visit','rate_loved',
])
const FRICTION = new Set([
  'spill_abandon','scan_abandon','share_dismiss','room_bounce','dead_click',
  'rage_click','paywall_bounce','rate_friction','error',
])
const QUESTION = new Set(['companion_q','search'])

function valence(type: string): 'love' | 'friction' | 'question' | 'neutral' {
  if (LOVE.has(type)) return 'love'
  if (FRICTION.has(type)) return 'friction'
  if (QUESTION.has(type)) return 'question'
  return 'neutral'
}

type IncomingEvent = {
  type?: string
  v?: string
  t?: number
  page?: string
  sid?: string
  alias?: string
  target?: string
  label?: string
  text?: string
  score?: number
  signature?: string
  intent?: string
  kind?: string
  sec?: number
  note?: string
  mode?: string
  trigger?: string
}

export const Route = createFileRoute('/api/feedback/events')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { events?: IncomingEvent[] }
          const raw = Array.isArray(body.events) ? body.events : []
          if (!raw.length) return new Response('{"ok":true,"n":0}', { status: 200, headers: { 'content-type': 'application/json' } })

          const rows = raw.slice(0, 200).filter((e) => typeof e.type === 'string' && e.type.length < 64).map((e) => {
            const v = (e.v === 'love' || e.v === 'friction' || e.v === 'question' || e.v === 'neutral') ? e.v : valence(e.type as string)
            return {
              type: e.type as string,
              v,
              t: e.t ? new Date(e.t).toISOString() : new Date().toISOString(),
              page: e.page?.slice(0, 200) ?? null,
              sid: e.sid?.slice(0, 64) ?? null,
              alias: e.alias?.slice(0, 80) ?? null,
              target: e.target?.slice(0, 120) ?? null,
              label: e.label?.slice(0, 120) ?? null,
              text: e.text?.slice(0, 800) ?? null,
              score: typeof e.score === 'number' ? e.score : null,
              signature: e.signature?.slice(0, 120) ?? null,
              intent: e.intent?.slice(0, 60) ?? null,
              kind: e.kind?.slice(0, 60) ?? null,
              sec: typeof e.sec === 'number' ? e.sec : null,
              note: e.note?.slice(0, 400) ?? null,
              mode: e.mode?.slice(0, 60) ?? null,
              trigger: e.trigger?.slice(0, 60) ?? null,
            }
          })

          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          )
          const { error } = await supabase.from('feedback_events').insert(rows)
          if (error) {
            console.error('feedback insert', error)
            return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } })
          }
          return new Response(JSON.stringify({ ok: true, n: rows.length }), { status: 200, headers: { 'content-type': 'application/json' } })
        } catch (err) {
          console.error('feedback handler', err)
          return new Response('{"ok":false}', { status: 400, headers: { 'content-type': 'application/json' } })
        }
      },
    },
  },
})
