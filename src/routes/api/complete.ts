import { createFileRoute } from '@tanstack/react-router'
import { generateText } from 'ai'
import { createLovableAiGatewayProvider } from '@/lib/ai-gateway.server'

interface CompleteBody {
  messages?: { role: 'user' | 'assistant'; content: string }[]
  system?: string
  maxTokens?: number
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
          const maxTokens = Math.min(Math.max(body.maxTokens ?? 600, 64), 2048)

          // Optional override: direct Anthropic when ANTHROPIC_API_KEY is set
          const anthropicKey = process.env.ANTHROPIC_API_KEY
          if (anthropicKey) {
            const MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest'
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify({
                model: MODEL,
                max_tokens: maxTokens,
                ...(body.system ? { system: body.system } : {}),
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
              }),
            })
            if (!res.ok) return fallback(`anthropic ${res.status}`)
            const data = (await res.json()) as { content?: { type: string; text?: string }[] }
            const text = (data.content ?? [])
              .filter((b) => b.type === 'text')
              .map((b) => b.text ?? '')
              .join('')
            return json({ text })
          }

          // Default path: Lovable AI Gateway
          const lovableKey = process.env.LOVABLE_API_KEY
          if (!lovableKey) return fallback('no AI key configured')

          const modelId = process.env.LOVABLE_AI_MODEL || 'google/gemini-3-flash-preview'
          const gateway = createLovableAiGatewayProvider(lovableKey)

          try {
            const result = await generateText({
              model: gateway(modelId),
              system: body.system,
              messages: messages.map((m) => ({ role: m.role, content: m.content })),
              maxOutputTokens: maxTokens,
            })
            return json({ text: result.text })
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'gateway error'
            // 429 rate limit / 402 credits — degrade gracefully
            return fallback(msg)
          }
        } catch (err) {
          return fallback(err instanceof Error ? err.message : 'completion failed')
        }
      },
    },
  },
})
