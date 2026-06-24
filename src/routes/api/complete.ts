import { createFileRoute } from '@tanstack/react-router'
import Anthropic from '@anthropic-ai/sdk'

interface CompleteBody {
  messages?: { role: 'user' | 'assistant'; content: string }[]
  system?: string
  maxTokens?: number
}

export const Route = createFileRoute('/api/complete')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ANTHROPIC_API_KEY
        if (!apiKey) {
          // Return 200 with a fallback signal — the UI has deterministic
          // fallbacks for every AI surface, and a 5xx here would otherwise
          // trip the runtime-error overlay.
          return new Response(
            JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured', fallback: true }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          )
        }
        const client = new Anthropic({ apiKey })
        const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-8'
        const body = (await request.json()) as CompleteBody
        const messages = Array.isArray(body.messages) ? body.messages : []
        if (!messages.length) {
          return new Response(JSON.stringify({ error: 'messages required' }), {
            status: 400,
            headers: { 'content-type': 'application/json' },
          })
        }
        const maxTokens = Math.min(Math.max(body.maxTokens ?? 600, 64), 2048)
        try {
          const msg = await client.messages.create({
            model: MODEL,
            max_tokens: maxTokens,
            ...(body.system ? { system: body.system } : {}),
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          })
          const text = msg.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('')
          return new Response(JSON.stringify({ text }), {
            headers: { 'content-type': 'application/json' },
          })
        } catch (err) {
          const status =
            err instanceof Anthropic.APIError && typeof err.status === 'number' ? err.status : 500
          return new Response(JSON.stringify({ error: 'completion failed' }), {
            status: status >= 400 && status < 600 ? status : 500,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
    },
  },
})
