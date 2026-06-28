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
          const body = (await request.json()) as CompleteBody
          const messages = Array.isArray(body.messages) ? body.messages : []
          if (!messages.length) return json({ error: 'messages required' }, 400)
          const maxTokens = Math.min(Math.max(body.maxTokens ?? 1500, 64), 4096)
          const wantStream = body.stream === true

          const lovableKey = process.env.LOVABLE_API_KEY
          if (!lovableKey) return fallback('no AI key configured')

          const modelId = process.env.LOVABLE_AI_MODEL || 'google/gemini-2.5-pro'
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
