import { createFileRoute } from '@tanstack/react-router'
import { generateText, streamText } from 'ai'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { createLovableAiGatewayProvider } from '@/lib/ai-gateway.server'
import { COMPANION_CONSTITUTION } from '@/lib/agents/constitution'
import type { Database } from '@/integrations/supabase/types'


interface CompleteBody {
  messages?: { role: 'user' | 'assistant'; content: string }[]
  system?: string
  maxTokens?: number
  stream?: boolean
}

const MAX_MESSAGES = 40
const MAX_MESSAGE_CHARS = 8000

// SHA-256 allowlist of known-good system prompts shipped by our own client
// flows (spill turn engine, spill reflect, scan, etc.). Any other value is
// rejected and the request falls back to COMPANION_CONSTITUTION, so this
// endpoint cannot be steered into arbitrary personas.
const ALLOWED_SYSTEM_HASHES = new Set<string>([
  'd61510546edd294d9d6228421014c1d7c24c2cf4288f8cfec13e826f13a5ff71', // SPILL_SYSTEM
  'c94c983c15d3b17459224ddd3fcfac6c13209656227d8940369d51ec01420987', // TURN_SYS
  '353973ed93925f7f1e8cd025fb75dc1efbbb9e1cf70e227e40383d5c15cfdb31', // SCAN_SYSTEM
  'fdac5e05546d70afa737684bce382fa627d2b33539b97743ecd50555f5f4c431', // reflectSystem
])

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
          // Only accept a client-supplied system prompt if it matches one of
          // the known-good hashes shipped by our own flows; otherwise fall
          // back to the Companion Constitution. This blocks arbitrary
          // persona injection while keeping spill/scan/reflect in-voice.
          let system = COMPANION_CONSTITUTION
          if (typeof body.system === 'string' && body.system.length > 0) {
            const hash = createHash('sha256').update(body.system).digest('hex')
            if (ALLOWED_SYSTEM_HASHES.has(hash)) system = body.system
          }


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
