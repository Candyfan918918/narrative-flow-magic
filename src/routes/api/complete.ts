import { createFileRoute } from '@tanstack/react-router'
import { generateText, streamText } from 'ai'
import { createLovableAiGatewayProvider } from '@/lib/ai-gateway.server'

interface CompleteBody {
  messages?: { role: 'user' | 'assistant'; content: string }[]
  system?: string
  maxTokens?: number
  stream?: boolean
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const fallback = (error: string) => json({ error, fallback: true })

export const Route = createFileRoute('/api/complete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Require an authenticated Supabase user (bearer token) to prevent quota abuse.
          const authHeader = request.headers.get('authorization') || ''
          if (!authHeader.toLowerCase().startsWith('bearer ')) {
            return json({ error: 'Unauthorized' }, 401)
          }
          const token = authHeader.slice(7).trim()
          try {
            const { createClient } = await import('@supabase/supabase-js')
            const sb = createClient(
              process.env.SUPABASE_URL!,
              process.env.SUPABASE_PUBLISHABLE_KEY!,
              { auth: { persistSession: false, autoRefreshToken: false } },
            )
            const { data, error } = await sb.auth.getUser(token)
            if (error || !data?.user) return json({ error: 'Unauthorized' }, 401)
          } catch {
            return json({ error: 'Unauthorized' }, 401)
          }

          const body = (await request.json()) as CompleteBody
          const messages = Array.isArray(body.messages) ? body.messages : []
          if (!messages.length) return json({ error: 'messages required' }, 400)
          const maxTokens = Math.min(Math.max(body.maxTokens ?? 600, 64), 2048)
          const wantStream = body.stream === true

          const lovableKey = process.env.LOVABLE_API_KEY
          if (!lovableKey) return fallback('no AI key configured')

          const modelId = process.env.LOVABLE_AI_MODEL || 'google/gemini-3-flash-preview'
          const gateway = createLovableAiGatewayProvider(lovableKey)
          const model = gateway(modelId)
          const msgs = messages.map((m) => ({ role: m.role, content: m.content }))

          if (wantStream) {
            try {
              const result = streamText({
                model,
                system: body.system,
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
              system: body.system,
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
