/* Frontend AI client. The prototype called window.claude.complete({messages});
   here we POST to our own backend (server/index.ts), which proxies to the
   Anthropic API. The backend returns plain text, matching the old contract.

   Every caller already has a deterministic fallback, so a failed/absent
   backend never breaks the UI — complete() throws and the caller catches. */

export interface CompleteMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function complete(opts: {
  messages: CompleteMessage[]
  system?: string
  maxTokens?: number
}): Promise<string> {
  const res = await fetch('/api/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })
  if (!res.ok) throw new Error(`complete failed: ${res.status}`)
  const data = (await res.json()) as { text?: string }
  if (typeof data.text !== 'string') throw new Error('complete: no text')
  return data.text
}

/** Extract the first balanced JSON object from a model response. */
export function extractJSON<T = unknown>(raw: string): T {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('no json')
  return JSON.parse(raw.slice(start, end + 1)) as T
}
