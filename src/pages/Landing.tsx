/* Pixel-perfect port of project/Landing.dc.html with agent bridge. */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { runSpill } from '@/lib/agents/spill.functions'
import { saveSituation, updateSituation } from '@/lib/situations.functions'
import { supabase } from '@/integrations/supabase/client'

export function LandingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  const spill = useServerFn(runSpill)
  const save = useServerFn(saveSituation)
  const update = useServerFn(updateSituation)

  // Resume a pending Spill save after the user returns from sign-in.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const raw = sessionStorage.getItem('shutap_pending_save')
      if (!raw) return
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session || cancelled) return
      try {
        const payload = JSON.parse(raw)
        const res = await save({ data: payload as never })
        sessionStorage.removeItem('shutap_pending_save')
        if (res?.room_id) navigate(`/stream#room-${res.room_id}`)
        else if (res?.id) navigate(`/profile`)
      } catch {
        // leave the payload so the user can retry
      }
    })()
    return () => { cancelled = true }
  }, [navigate, save])


  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      const d = e.data as
        | { type?: string; plan?: string; raw?: string; pillar?: string; reqId?: string; is_public?: boolean; to?: string; hash?: string; payload?: Record<string, unknown>; id?: string; patch?: Record<string, unknown> }
        | null
      if (!d || !d.type) return
      const post = (payload: unknown) =>
        iframeRef.current?.contentWindow?.postMessage(payload, '*')
      if (d.type === 'shutap-nav' && d.to) {
        navigate(d.to + (d.hash || ''))
        return
      }
      if (d.type === 'shutap-subscribe') {
        const plan = d.plan === 'monthly' ? 'monthly' : 'annual'
        navigate(`/subscribe?plan=${plan}`)
      } else if (d.type === 'shutap-manage-sub') {
        navigate('/profile')
      } else if (d.type === 'shutap-spill' && d.raw) {
        try {
          const pillar = (d.pillar === 'marriage' || d.pillar === 'family' || d.pillar === 'career')
            ? d.pillar : 'relationships'
          const result = await spill({
            data: { raw: d.raw, pillar, is_public: d.is_public ?? true },
          })
          post({ type: 'shutap-spill-result', reqId: d.reqId, ...result })
        } catch (err) {
          post({ type: 'shutap-spill-result', reqId: d.reqId, error: err instanceof Error ? err.message : 'spill failed' })
        }
      } else if (d.type === 'shutap-persist-situation' && d.payload) {
        try {
          const { data: sess } = await supabase.auth.getSession()
          if (!sess.session) {
            sessionStorage.setItem('shutap_pending_save', JSON.stringify(d.payload))
            post({ type: 'shutap-persist-situation-result', reqId: d.reqId, error: 'auth_required' })
            navigate('/welcome')
            return
          }
          const res = await save({ data: d.payload as never })
          post({ type: 'shutap-persist-situation-result', reqId: d.reqId, id: res.id, room_id: res.room_id })
          // Drop the user straight into the destination.
          if (res?.room_id) navigate(`/stream#room-${res.room_id}`)
          else if (res?.id) navigate('/profile')
        } catch (err) {
          post({ type: 'shutap-persist-situation-result', reqId: d.reqId, error: err instanceof Error ? err.message : 'save failed' })
        }
      } else if (d.type === 'shutap-update-situation' && d.id && d.patch) {
        try {
          const { data: sess } = await supabase.auth.getSession()
          if (!sess.session) { navigate('/welcome'); return }
          const res = await update({ data: { id: d.id, ...d.patch } as never })
          post({ type: 'shutap-update-situation-result', reqId: d.reqId, id: res.id, room_id: res.room_id })

        } catch (err) {
          post({ type: 'shutap-update-situation-result', reqId: d.reqId, error: err instanceof Error ? err.message : 'update failed' })
        }
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate, spill, save, update])



  // Inject window.claude into the iframe so the bundled Spill/Scan/Mirror
  // can call the same-origin /api/complete gateway. The bundler swaps
  // documentElement at runtime but the contentWindow persists, so we
  // re-assert the binding a few times to survive that swap.
  const injectClaude = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const w = iframe.contentWindow as (Window & { claude?: unknown }) | null
      if (!w) return
      const existing = w.claude as { complete?: unknown; stream?: unknown } | undefined
      if (existing && typeof existing.complete === 'function' && typeof existing.stream === 'function') {
        return
      }

      const SPILL_SYSTEM = "You are the user's closest, most emotionally attuned friend — warm, tender, human, lowercase, texty, fully on their side. Your FIRST job every turn is to make them feel deeply understood: name the specific feeling under what they said and reflect it back in your own warm words, with real sympathy (e.g. 'that sounds so lonely', 'ugh, that would shake anyone', 'i can feel how heavy this is'). Be genuinely moved, never clinical or peppy. THEN, gently draw them deeper — into what it actually feels like in their body and heart, what it reminds them of, why it matters so much to them, what they're most afraid of or needing right now — AND ask ONE concrete, practical question tied to the EXACT thing they named. Hold both: real emotional depth AND a specific, grounded question. NEVER ask flat generic lines like 'how do you feel?', 'are you having trouble sleeping?', or 'how did that make you feel?' — instead get specific. Worked examples of the right instinct: period 2 weeks early → reflect the worry/scared feeling first ('that's unsettling when your body does something unexpected'), then ask: have you been able to see or call a doctor? is this a one-off or has your cycle felt off lately? how are you feeling physically right now? Staying up all night → reflect it ('those long awake hours can feel so isolating'), then ask: what's actually running through your mind when you can't sleep? have you tried anything that helps even a little? is there someone — family, a friend, or something you could do for yourself — that might ease it? Always lead with sympathy and reflection, go one real layer deeper into their personal experience, and keep your reply in the EXACT same JSON format and short-bubble structure the rest of the instructions require — only the warmth, depth, and specificity of your words should change."

      const SCAN_SYSTEM = "You are the user's warm, emotionally attuned friend running a gentle check-in on how heavy a situation feels right now. Stay tender and human (lowercase, texty), never clinical or quiz-like. Each step, react to the SPECIFIC thing they just chose or wrote — name the feeling under it with real sympathy ('that sounds exhausting', 'oof, that one lingers') before the next card. Make every card feel personal and earned, going one layer deeper toward the real fear/need/grief underneath, not generic. NEVER write a flat generic prompt like 'how do you feel?' — tie it to their exact situation. When you reach a genuine read, reflect it back with warmth and care in the final result. Keep your reply in the EXACT same JSON shape the rest of the instructions require (a card object, or the done/score object) — only the warmth, depth, and specificity of your words should change; never add prose outside the JSON."

      const isSpillTurn = (o: Record<string, unknown>): boolean => {
        try {
          const msgs = Array.isArray(o.messages) ? (o.messages as Array<{ content?: unknown }>) : []
          for (const m of msgs) {
            const c = typeof m?.content === 'string' ? m.content : ''
            if (c.indexOf('THE SPILL on Shutap') !== -1) return true
          }
          const p = typeof o.prompt === 'string' ? o.prompt : ''
          if (p.indexOf('THE SPILL on Shutap') !== -1) return true
        } catch { /* ignore */ }
        return false
      }

      const isScanTurn = (o: Record<string, unknown>): boolean => {
        try {
          const msgs = Array.isArray(o.messages) ? (o.messages as Array<{ content?: unknown }>) : []
          for (const m of msgs) {
            const c = typeof m?.content === 'string' ? m.content : ''
            if (c.indexOf('THE SCAN on Shutap') !== -1) return true
          }
          const p = typeof o.prompt === 'string' ? o.prompt : ''
          if (p.indexOf('THE SCAN on Shutap') !== -1) return true
        } catch { /* ignore */ }
        return false
      }

      const buildBody = (opts: Record<string, unknown>, stream: boolean) => {
        const o = opts || {}
        const messages = Array.isArray(o.messages)
          ? o.messages
          : [{ role: 'user', content: o.prompt != null ? String(o.prompt) : '' }]
        const body: Record<string, unknown> = {
          messages,
          maxTokens: (o.maxTokens as number) || 1500,
        }
        if (o.system) body.system = o.system
        else if (isSpillTurn(o)) body.system = SPILL_SYSTEM
        else if (isScanTurn(o)) body.system = SCAN_SYSTEM
        if (stream) body.stream = true
        return body
      }

      const complete = async (opts: Record<string, unknown>) => {
        let res: Response

        try {
          res = await fetch('/api/complete', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(buildBody(opts, false)),
            signal: opts?.signal as AbortSignal | undefined,
          })
        } catch (e) {
          throw new Error('network: ' + ((e as Error)?.message || 'failed'))
        }
        let data: { text?: string; error?: string; fallback?: boolean } | null = null
        try { data = await res.json() } catch { /* ignore */ }
        if (!res.ok) throw new Error('ai ' + res.status + (data?.error ? ': ' + data.error : ''))
        if (data?.fallback) throw new Error(data.error || 'ai unavailable')
        return typeof data?.text === 'string' ? data.text : ''
      }

      const stream = async (opts: Record<string, unknown>) => {
        const o = opts || {}
        const onChunk = typeof o.onChunk === 'function' ? (o.onChunk as (c: string, acc: string) => void) : null
        let res: Response
        try {
          res = await fetch('/api/complete', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(buildBody(o, true)),
            signal: o.signal as AbortSignal | undefined,
          })
        } catch (e) {
          throw new Error('network: ' + ((e as Error)?.message || 'failed'))
        }
        if (!res.ok) {
          let errText = ''
          try { errText = await res.text() } catch { /* ignore */ }
          throw new Error('ai ' + res.status + (errText ? ': ' + errText.slice(0, 200) : ''))
        }
        const ct = (res.headers.get('content-type') || '').toLowerCase()
        if (ct.includes('application/json')) {
          const data = await res.json() as { text?: string; error?: string; fallback?: boolean }
          if (data?.fallback) throw new Error(data.error || 'ai unavailable')
          const text = typeof data?.text === 'string' ? data.text : ''
          if (text && onChunk) onChunk(text, text)
          return text
        }
        if (!res.body) {
          const full = await res.text()
          if (full && onChunk) onChunk(full, full)
          return full
        }
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let acc = ''
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const step = await reader.read()
          if (step.done) break
          const chunk = decoder.decode(step.value, { stream: true })
          if (!chunk) continue
          acc += chunk
          if (onChunk) { try { onChunk(chunk, acc) } catch { /* ignore */ } }
        }
        const tail = decoder.decode()
        if (tail) {
          acc += tail
          if (onChunk) { try { onChunk(tail, acc) } catch { /* ignore */ } }
        }
        return acc
      }

      ;(w as unknown as { claude: unknown }).claude = { complete, stream }
    } catch {
      // cross-origin or other edge case — leave the bundle's fallback in place
    }
  }


  return (
    <iframe
      ref={iframeRef}
      src="/shutap/Shutap-Landing.dc.html"
      title="Shutap — Landing"
      onLoad={() => {
        injectClaude()
        // Re-assert after the bundler swaps documentElement at runtime.
        setTimeout(injectClaude, 0)
        setTimeout(injectClaude, 400)
        setTimeout(injectClaude, 1200)
      }}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, background: '#fdf0f5' }}
    />
  )
}

