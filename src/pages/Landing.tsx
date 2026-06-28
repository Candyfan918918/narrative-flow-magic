/* Pixel-perfect port of project/Landing.dc.html with agent bridge. */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { runSpill } from '@/lib/agents/spill.functions'
import { saveSituation, updateSituation } from '@/lib/situations.functions'

export function LandingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  const spill = useServerFn(runSpill)
  const save = useServerFn(saveSituation)
  const update = useServerFn(updateSituation)
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
          const res = await save({ data: d.payload as never })
          post({ type: 'shutap-persist-situation-result', reqId: d.reqId, id: res.id, room_id: res.room_id })
        } catch (err) {
          post({ type: 'shutap-persist-situation-result', reqId: d.reqId, error: err instanceof Error ? err.message : 'save failed' })
        }
      } else if (d.type === 'shutap-update-situation' && d.id && d.patch) {
        try {
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
      src="/shutap/Shutap-0627.html"
      title="Shutap — Landing"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, background: '#fdf0f5' }}
    />
  )
}
