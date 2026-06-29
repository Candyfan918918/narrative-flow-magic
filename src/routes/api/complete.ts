import { createFileRoute } from '@tanstack/react-router'
import { generateText, streamText } from 'ai'
import { createLovableAiGatewayProvider } from '@/lib/ai-gateway.server'
import { COMPANION_CONSTITUTION } from '@/lib/agents/constitution'


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

          const modelId = process.env.LOVABLE_AI_MODEL || 'google/gemini-2.5-flash'
          const gateway = createLovableAiGatewayProvider(lovableKey)
          const model = gateway(modelId)
          const msgs = messages.map((m) => ({ role: m.role, content: m.content }))
          // If the caller didn't bring their own system prompt, fall back to the
          // Companion Constitution so spill/scan responses stay warm and in-voice
          // instead of cold and clinical.
          const system = body.system && body.system.trim().length > 0
            ? body.system
            : COMPANION_CONSTITUTION


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
