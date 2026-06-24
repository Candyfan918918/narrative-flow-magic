/* Pixel-perfect port of project/Profile.dc.html — served verbatim. */
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createMirrorPortal } from '@/lib/payments.functions'
import { getStripeEnvironment } from '@/lib/stripe'

export function ProfilePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  useEffect(() => {
    const onMsg = async (e: MessageEvent) => {
      const d = e.data as { type?: string; plan?: string } | null
      if (!d) return
      if (d.type === 'shutap-subscribe') {
        const plan = d.plan === 'monthly' ? 'monthly' : 'annual'
        navigate(`/subscribe?plan=${plan}`)
      } else if (d.type === 'shutap-manage-sub') {
        try {
          const r = await createMirrorPortal({
            data: { environment: getStripeEnvironment(), returnUrl: window.location.origin + '/profile' },
          })
          if ('url' in r) window.open(r.url, '_blank')
        } catch {}
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate])
  return (
    <iframe
      ref={iframeRef}
      src="/shutap/Profile.dc.html"
      title="Shutap — Profile"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#fdf0f5' }}
    />
  )
}
