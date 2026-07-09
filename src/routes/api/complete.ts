import { createFileRoute } from '@tanstack/react-router'
import { generateText, streamText } from 'ai'
import { createClient } from '@supabase/supabase-js'
import { createLovableAiGatewayProvider } from '@/lib/ai-gateway.server'
import { COMPANION_CONSTITUTION } from '@/lib/agents/constitution'
import type { Database } from '@/integrations/supabase/types'


interface CompleteBody {
  messages?: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
  stream?: boolean
}

const MAX_MESSAGES = 40
const MAX_MESSAGE_CHARS = 8000

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const fallback = (error: string) => json({ error, fallback: true })

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_')
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    )
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value))
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization')
    }
    headers.set('apikey', supabaseKey)
    return fetch(input, { ...init, headers })
  }
}

export const Route = createFileRoute('/api/complete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Auth gate: require a valid project-issued Supabase JWT before any
          // inference. Anonymous Supabase sessions are allowed (guest spill/scan
          // on the landing page), we just refuse unauthenticated traffic so this
          // isn't an open AI proxy billed to LOVABLE_API_KEY.
          // TODO: add per-user rate limiting as a follow-up.
          const authHeader = request.headers.get('authorization')
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'unauthorized' }, 401)
          }
          const token = authHeader.slice('Bearer '.length).trim()
          if (!token || token.split('.').length !== 3) {
            return json({ error: 'unauthorized' }, 401)
          }
          const SUPABASE_URL = process.env.SUPABASE_URL
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY
          if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
            return json({ error: 'unauthorized' }, 401)
          }
          const authSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: {
              fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
              headers: { Authorization: `Bearer ${token}` },
            },
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          })
          const { data: claimsData, error: claimsError } = await authSupabase.auth.getClaims(token)
          if (claimsError || !claimsData?.claims?.sub) {
            return json({ error: 'unauthorized' }, 401)
          }

          const body = (await request.json()) as CompleteBody
          const rawMessages = Array.isArray(body.messages) ? body.messages : []
          if (!rawMessages.length) return json({ error: 'messages required' }, 400)
          // Enforce hard limits on caller-supplied conversation to prevent
          // abuse of the shared Lovable AI key.
          const messages = rawMessages.slice(-MAX_MESSAGES).map((m) => ({
            role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: String(m.content ?? '').slice(0, MAX_MESSAGE_CHARS),
          }))
          const maxTokens = Math.min(Math.max(body.maxTokens ?? 1500, 64), 4096)
          const wantStream = body.stream === true

          const lovableKey = process.env.LOVABLE_API_KEY
          if (!lovableKey) return fallback('no AI key configured')

          const modelId = process.env.LOVABLE_AI_MODEL || 'google/gemini-2.5-flash'
          const gateway = createLovableAiGatewayProvider(lovableKey)
          const model = gateway(modelId)
          const msgs = messages
          // System prompt is server-controlled — callers cannot override it.
          const system = COMPANION_CONSTITUTION


          if (wantStream) {
            try {
              const result = streamText({
                model,
                system,

                messages: msgs,
                maxOutputTokens: maxTokens,
              })
              return result.toTextStreamResponse({
                headers: { 'cache-control': 'no-cache, no-transform' },
              })
            } catch (err) {
              return fallback(err instanceof Error ? err.message : 'stream error')
            }
          }

          try {
            const result = await generateText({
              model,
              system,
              messages: msgs,
              maxOutputTokens: maxTokens,
            })
            return json({ text: result.text })
          } catch (err) {
            return fallback(err instanceof Error ? err.message : 'gateway error')
          }
        } catch (err) {
          return fallback(err instanceof Error ? err.message : 'completion failed')
        }
      },
    },
  },
})
