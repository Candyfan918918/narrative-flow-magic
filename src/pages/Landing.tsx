/* Pixel-perfect port of project/Landing.dc.html with agent bridge. */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { runSpill } from '@/lib/agents/spill.functions'

export function LandingPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  const spill = useServerFn(runSpill)
  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      const d = e.data as { type?: string; plan?: string; raw?: string; pillar?: string; reqId?: string; is_public?: boolean; to?: string; hash?: string } | null
      if (!d) return
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
        const post = (payload: unknown) =>
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'shutap-spill-result', reqId: d.reqId, ...((payload as object) || {}) },
            '*',
          )
        try {
          const pillar = (d.pillar === 'marriage' || d.pillar === 'family' || d.pillar === 'career')
            ? d.pillar : 'relationships'
          const result = await spill({
            data: { raw: d.raw, pillar, is_public: d.is_public ?? true },
          })
          post(result)
        } catch (err) {
          post({ error: err instanceof Error ? err.message : 'spill failed' })
        }
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate, spill])
  return (
    <iframe
      ref={iframeRef}
      src="/shutap/Shutap-0627.html"
      title="Shutap — Landing"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, margin: 0, padding: 0, background: '#fdf0f5' }}
    />
  )
}

