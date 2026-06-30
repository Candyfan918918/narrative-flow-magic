/* Pixel-perfect port of project/Landing.dc.html with agent bridge. */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { runSpill } from '@/lib/agents/spill.functions'
import { saveSituation, updateSituation } from '@/lib/situations.functions'
import { supabase } from '@/integrations/supabase/client'

// ── Shared sync helpers (used by the poll loop AND the postMessage bridge so
// a spill is never persisted twice). Keyed by both the bundle entry id and a
// content hash so either code path stamps it for the other to skip.
const SYNCED_KEY = 'shutap_situations_synced'
function getSynced(): Record<string, string> {
  try {
    const cur = sessionStorage.getItem(SYNCED_KEY)
    if (cur) return JSON.parse(cur)
    const legacy = sessionStorage.getItem('shutap_scan_synced')
    if (legacy) { sessionStorage.setItem(SYNCED_KEY, legacy); return JSON.parse(legacy) }
    return {}
  } catch { return {} }
}
function writeSynced(m: Record<string, string>) {
  try { sessionStorage.setItem(SYNCED_KEY, JSON.stringify(m)) } catch { /* ignore */ }
}
function pillarMap(p?: string | null): 'relationships' | 'marriage' | 'family' | 'career' {
  if (p === 'family') return 'family'
  if (p === 'marriage') return 'marriage'
  if (p === 'career' || p === 'work') return 'career'
  return 'relationships'
}
function deriveTitleLocal(text: string): string {
  const first = (text || '').split(/[.\n!?]/)[0]?.trim() || ''
  return first.length > 60 ? first.slice(0, 57) + '…' : first
}
function hashKey(input: { pillar?: string | null; title?: string | null; body?: string | null; clean_text?: string | null }): string {
  const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 240)
  const raw = pillarMap(input.pillar) + '|' + norm(input.title) + '|' + norm(input.body || input.clean_text)
  let h = 5381
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

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
        const payload = JSON.parse(raw) as { id?: string; pillar?: string | null; title?: string | null; body?: string | null; clean_text?: string | null }
        const res = await save({ data: payload as never })
        try {
          const synced = getSynced()
          const h = hashKey({ pillar: payload.pillar, title: payload.title, body: payload.body || payload.clean_text })
          synced['hash:' + h] = res?.id || '1'
          if (payload.id) synced['bundle:' + payload.id] = res?.id || '1'
          writeSynced(synced)
        } catch { /* ignore */ }
        sessionStorage.removeItem('shutap_pending_save')
        if (res?.room_id) navigate(`/stream#room-${res.room_id}`)
        else if (res?.id) navigate(`/profile`)
      } catch {
        // leave the payload so the user can retry
      }
    })()
    return () => { cancelled = true }
  }, [navigate, save])

  // ── Non-invasive situation sync (scans + spills) ──
  // The bundle writes scan & spill results into the iframe's
  // localStorage['shutap_situations']. We poll same-origin, persist any new
  // entry to Supabase via the existing saveSituation server fn, and mirror
  // it into localStorage['shutap_user_situations'] so the React Stream /
  // Profile pick it up without a reload. Deduped across this loop AND the
  // shutap-persist-situation postMessage bridge via SYNCED_KEY (id + hash).
  useEffect(() => {
    type ScanBand = 'settling' | 'sitting' | 'weighing' | 'heavy' | 'consuming'
    type Mirror = {
      id: string; alias: string; emoji: string; title: string; body: string;
      reflection: string; hall: 'healing' | 'brave' | 'relatable' | 'loving';
      support: 'heard' | 'advice'; hours: string; relates: number; sitting: number;
      reactions: { heard: number; same: number; strong: number; time: number; brave: number };
      kind: 'scan' | 'spill'; initial_scan?: number;
      scan_band?: ScanBand; scan_signature?: string; pillar?: string | null;
    }
    type BundleSit = {
      id?: string; kind?: string; scan?: number | string; read?: string;
      title?: string; body?: string | null; pillar?: string | null;
      visibility?: string; tags?: unknown; mode?: string;
    }

    const bandFromScore = (n: number): ScanBand =>
      n < 200 ? 'settling' : n < 400 ? 'sitting' : n < 600 ? 'weighing' : n < 800 ? 'heavy' : 'consuming'
    const dbBand: Record<ScanBand, 'quiet' | 'real' | 'hot' | 'heavy' | 'serious'> = {
      settling: 'quiet', sitting: 'real', weighing: 'hot', heavy: 'heavy', consuming: 'serious',
    }

    let busy = false
    const tick = async () => {
      if (busy) return
      const w = iframeRef.current?.contentWindow
      if (!w) return
      let arr: BundleSit[] = []
      try {
        const raw = (w as Window).localStorage?.getItem('shutap_situations') || '[]'
        arr = JSON.parse(raw)
      } catch { return /* cross-origin or parse error */ }
      // Pick up scans AND spills (spills typically have no `kind` field).
      const entries = arr.filter((s) => s && s.id && s.kind !== 'deleted')
      if (!entries.length) return
      const synced = getSynced()
      const pending = entries.filter((s) => {
        if (synced['bundle:' + s.id!]) return false
        const h = hashKey({ pillar: s.pillar, title: s.title, body: s.body || s.read })
        if (synced['hash:' + h]) return false
        return true
      })
      if (!pending.length) return

      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) return // wait — pseudo-session will appear once root bootstraps it

      busy = true
      let mirror: Mirror[] = []
      try { mirror = JSON.parse(localStorage.getItem('shutap_user_situations') || '[]') } catch { /* ignore */ }
      const mirrorIds = new Set(mirror.map((x) => x.id))
      let mirrorChanged = false

      for (const s of pending) {
        const isScan = s.kind === 'scan'
        const isPublic = s.visibility === 'public'
        const tags = Array.isArray(s.tags) ? (s.tags as unknown[]).map(String).slice(0, 12) : []
        const support: 'heard' | 'advice' = s.mode === 'advice' ? 'advice' : 'heard'
        const pillar = pillarMap(s.pillar)
        const rawBody = String((s.body ?? s.read) || '').trim()
        const rawTitle = String(s.title || '').trim()
        const title = rawTitle || deriveTitleLocal(rawBody)
        const cleanText = rawBody || title
        const h = hashKey({ pillar: s.pillar, title, body: rawBody })

        try {
          if (isScan) {
            const score = Math.max(0, Math.min(999, Number(s.scan) || 0))
            const band = bandFromScore(score)
            await save({
              data: {
                kind: 'scan', pillar,
                clean_text: cleanText, title: title || null, body: rawBody || null,
                initial_scan: score, scan_band: dbBand[band],
                is_public: isPublic, support_mode: 'heard', tags,
              } as never,
            })
            if (!mirrorIds.has(s.id!)) {
              mirror.unshift({
                id: s.id!, alias: 'you', emoji: '✨', title: title || '',
                body: rawBody, reflection: rawBody, hall: 'healing',
                support: 'heard', hours: 'just now', relates: 0, sitting: 1,
                reactions: { heard: 0, same: 0, strong: 0, time: 0, brave: 0 },
                kind: 'scan', initial_scan: score, scan_band: band,
                scan_signature: title || '', pillar: s.pillar || null,
              })
              mirrorChanged = true
            }
          } else {
            // Spill — no scan score/band fields, render as a normal spill card.
            if (!cleanText) { synced['bundle:' + s.id!] = '1'; continue }
            await save({
              data: {
                kind: 'spill', pillar,
                clean_text: cleanText, title: title || null, body: rawBody || null,
                is_public: isPublic, support_mode: support, tags,
              } as never,
            })
            if (!mirrorIds.has(s.id!)) {
              mirror.unshift({
                id: s.id!, alias: 'you', emoji: '🩷', title: title || '',
                body: rawBody, reflection: rawBody, hall: 'healing',
                support, hours: 'just now', relates: 0, sitting: 1,
                reactions: { heard: 0, same: 0, strong: 0, time: 0, brave: 0 },
                kind: 'spill', pillar: s.pillar || null,
              })
              mirrorChanged = true
            }
          }
          synced['bundle:' + s.id!] = '1'
          synced['hash:' + h] = '1'
        } catch {
          // leave unsynced for next tick
        }
      }
      writeSynced(synced)
      if (mirrorChanged) {
        try {
          localStorage.setItem('shutap_user_situations', JSON.stringify(mirror.slice(0, 50)))
          window.dispatchEvent(new StorageEvent('storage', { key: 'shutap_user_situations' }))
        } catch { /* ignore */ }
      }
      busy = false
    }

    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [save])



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
          // Stamp the shared synced map so the poll loop doesn't double-create
          // this entry if the bundle also wrote it to shutap_situations.
          try {
            const p = d.payload as { id?: string; pillar?: string | null; title?: string | null; body?: string | null; clean_text?: string | null }
            const synced = getSynced()
            const h = hashKey({ pillar: p.pillar, title: p.title, body: p.body || p.clean_text })
            synced['hash:' + h] = res?.id || '1'
            if (p.id) synced['bundle:' + p.id] = res?.id || '1'
            writeSynced(synced)
          } catch { /* ignore */ }
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

      const SCAN_SYSTEM = "You are the user's wisest, most emotionally attuned friend — warm, tender, deeply human, lowercase, texty, fully on their side — gently reading how heavy a situation feels and helping them understand WHY, all the way down. This is a caring conversation, NOT a quiz. THE OPENING CARD must build trust: gently acknowledge it took something to bring this here, reassure them this is a safe, no-judgment space, and invite the specifics in a warm, guiding way (not a cold 'what's going on?'). Then DIG TO THE ROOT, like a friend who keeps gently asking what's underneath: don't stop at how it feels or why it's happening — trace the chain. Treat what they first say as the SURFACE symptom; each turn, find the cause beneath it, then the cause beneath THAT, laddering down (a 'why under the why') toward the fundamental root — the real fear, unmet need, old wound, relationship pattern, health/stress driver, or belief that's actually generating the surface reaction and emotion. React first with genuine sympathy ('oof, that sits heavy', 'that sounds scary, honestly'), then REASON like a perceptive friend and ask ONE smart, specific, hypothesis-driven question that goes a layer DEEPER than the last — connect body, mind, history, and life. Example: 'period 2 weeks early' (surface) → the body may be reacting to stress/sleep/health/hormones (cause) → so explore what's driving that stress ('what's been weighing on you lately?') (deeper cause) → then what's under THAT (a fear, a relationship, pressure, something unspoken) (root). Keep gently descending until you reach something that feels fundamental, then reflect it back with real warmth and a sense of what might help. INTERACTIVITY: run MANY cards (aim ~8–12, don't wrap up early), vary the input type each step favoring tactile ones (spectrum, rate, rank, multi, free text); for any choice/multi card offer 5–7 specific human options AND always include an open escape like 'something else…' / 'let me say it in my own words', and drop to a free-text card when nothing fits — never trap them in a wrong answer, never ask a flat generic 'how do you feel?'. Keep your reply in the EXACT same JSON shape the rest of the instructions require (a card object {line,prompt,card:{...}}, or the done/score object); never add prose outside the JSON."

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


  // Forward the parent URL hash into the iframe so /#spill, /#scan, /#mirror,
  // /#ask open the right modal. The iframe page reads location.hash on init
  // and listens to hashchange, but its own URL never carries our hash, so we
  // poke it directly.
  const syncHashToIframe = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    const h = window.location.hash || ''
    if (!/^#(spill|scan|mirror|ask)$/.test(h)) return
    try {
      const w = iframe.contentWindow as (Window & { location: Location }) | null
      if (!w) return
      // Setting hash to the same value is a no-op + no hashchange fires, so
      // clear it first to guarantee the iframe's hashchange handler runs.
      try { w.location.hash = '' } catch { /* ignore */ }
      try { w.location.hash = h } catch { /* ignore */ }
      // Strip the intent hash from the parent URL so a reload of / won't
      // silently re-open the modal. Only runs when an intent hash was handled.
      try { history.replaceState(null, '', window.location.pathname + window.location.search) } catch {}
    } catch { /* cross-origin */ }

  }

  useEffect(() => {
    const onHash = () => syncHashToIframe()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])


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
        // Forward any pending parent hash (e.g. arrived via /#spill from the
        // Mirror page) once the iframe document is ready.
        setTimeout(syncHashToIframe, 400)
        setTimeout(syncHashToIframe, 1200)
        // Bridge: route ONLY explicit mirror CTAs to /mirror. Earlier this
        // walked 6 ancestors and matched any parent textContent containing
        // "the mirror" — which captured the spill/scan CTAs whenever the
        // surrounding section mentioned the mirror in marketing copy.
        const installMirrorBridge = () => {
          try {
            const doc = iframeRef.current?.contentDocument
            const w = iframeRef.current?.contentWindow as (Window & { __shutapMirrorBridge?: boolean }) | null
            if (!doc || !w || w.__shutapMirrorBridge) return
            w.__shutapMirrorBridge = true
            doc.addEventListener('click', (ev) => {
              const target = ev.target as HTMLElement | null
              if (!target) return
              // Find the nearest interactive element the user actually clicked.
              const hit = (target.closest?.(
                '[data-action="mirror"], a[href="/mirror"], a[href$="#mirror"], [role="button"], button, a',
              ) as HTMLElement | null) || target
              const ownText = (hit.textContent || '').trim().toLowerCase()
              const ds = (hit.dataset?.action || '').toLowerCase()
              const href = hit.getAttribute?.('href') || ''
              const isMirror =
                ds === 'mirror' ||
                href === '/mirror' ||
                href.endsWith('#mirror') ||
                // Only match when the clicked control's OWN text leads with
                // "the mirror" — not just contains it somewhere deep.
                /^the mirror(\s|$|✦|·|—|-)/.test(ownText)
              if (!isMirror) return
              ev.preventDefault(); ev.stopPropagation()
              window.postMessage({ type: 'shutap-nav', to: '/mirror' }, '*')
            }, true)
          } catch { /* cross-origin or not ready */ }
        }
        installMirrorBridge()
        setTimeout(installMirrorBridge, 600)
        setTimeout(installMirrorBridge, 1500)
      }}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, background: '#fdf0f5' }}
    />
  )
}

