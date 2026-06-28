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
  return (
    <iframe
      ref={iframeRef}
      src="/shutap/Shutap-Landing.dc.html"
      title="Shutap — Landing"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, background: '#fdf0f5' }}
    />
  )
}
