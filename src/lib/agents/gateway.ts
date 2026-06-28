// Shared AI Gateway helper for agent server functions.
// Uses Lovable AI Gateway by default; honors ANTHROPIC_API_KEY override.
import { generateText } from 'ai'
import { createLovableAiGatewayProvider } from '@/lib/ai-gateway.server'

export type AgentMessage = { role: 'user' | 'assistant'; content: string }

export async function callAgent(opts: {
  system?: string
  messages: AgentMessage[]
  maxTokens?: number
  jsonMode?: boolean
}): Promise<{ text: string; error?: string }> {
  const maxTokens = Math.min(Math.max(opts.maxTokens ?? 1500, 64), 4096)
  const lovableKey = process.env.LOVABLE_API_KEY
  if (!lovableKey) return { text: '', error: 'no AI key' }
  const modelId = process.env.LOVABLE_AI_MODEL || 'google/gemini-3-flash-preview'
  try {
    const gateway = createLovableAiGatewayProvider(lovableKey)
    const result = await generateText({
      model: gateway(modelId),
      system: opts.system,
      messages: opts.messages,
      maxOutputTokens: maxTokens,
    })
    return { text: result.text }
  } catch (err) {
    return { text: '', error: err instanceof Error ? err.message : 'gateway error' }
  }
}

export function tryParseJson<T>(text: string): T | null {
  if (!text) return null
  // strip ```json fences if present
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // try to find first { ... } block
    const m = cleaned.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) as T } catch { return null }
    }
    return null
  }
}
