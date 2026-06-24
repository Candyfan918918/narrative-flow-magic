import { createFileRoute } from '@tanstack/react-router'

interface CompleteBody {
  messages?: { role: 'user' | 'assistant'; content: string }[]
  system?: string
  maxTokens?: number
}

export const Route = createFileRoute('/api/complete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const fallback = (error: string) =>
          new Response(JSON.stringify({ error, fallback: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })

        try {
          const apiKey = process.env.ANTHROPIC_API_KEY
          if (!apiKey) return fallback('ANTHROPIC_API_KEY not configured')

          const body = (await request.json()) as CompleteBody
          const messages = Array.isArray(body.messages) ? body.messages : []
          if (!messages.length) {
            return new Response(JSON.stringify({ error: 'messages required' }), {
              status: 400,
              headers: { 'content-type': 'application/json' },
            })
          }
          const maxTokens = Math.min(Math.max(body.maxTokens ?? 600, 64), 2048)
          const MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest'

          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-api-key': apiKey,
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
          const data = (await res.json()) as {
            content?: { type: string; text?: string }[]
          }
          const text = (data.content ?? [])
            .filter((b) => b.type === 'text')
            .map((b) => b.text ?? '')
            .join('')
          return new Response(JSON.stringify({ text }), {
            headers: { 'content-type': 'application/json' },
          })
        } catch (err) {
          return fallback(err instanceof Error ? err.message : 'completion failed')
        }
      },
    },
  },
})
