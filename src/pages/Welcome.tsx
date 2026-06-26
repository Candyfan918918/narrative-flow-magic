import { useEffect, useRef } from 'react'
import { lovable } from '@/integrations/lovable'
import { supabase } from '@/integrations/supabase/client'
import { recordLegalAcceptance } from '@/lib/legal.functions'

/* Pixel-perfect iframe of the Welcome prototype, with real auth wired through
   postMessage so Google/Apple/email actually authenticate via Lovable Cloud. */
export function WelcomePage() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // If we just returned from an OAuth redirect, flag the iframe so it skips
    // straight to the age gate on mount, and stamp legal acceptance.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        try { sessionStorage.setItem('shutap_authed', '1') } catch {}
        recordLegalAcceptance({ data: {} }).catch(() => {})
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        recordLegalAcceptance({ data: {} }).catch(() => {})
      }
    })

    const post = (msg: unknown) => {
      iframeRef.current?.contentWindow?.postMessage(msg, '*')
    }

    const onMessage = async (e: MessageEvent) => {
      const data = e.data as { type?: string; method?: string; email?: string } | null
      if (!data || data.type !== 'shutap-auth') return
      try {
        if (data.method === 'google' || data.method === 'apple') {
          const result = await lovable.auth.signInWithOAuth(data.method, {
            redirect_uri: window.location.origin + '/welcome',
          })
          if (result.error) {
            post({ type: 'shutap-auth-error', msg: result.error.message || 'sign-in failed' })
            return
          }
          if (result.redirected) return // browser is leaving
          post({ type: 'shutap-auth-ok' })
        } else if (data.method === 'email' && data.email) {
          const { error } = await supabase.auth.signInWithOtp({
            email: data.email,
            options: { emailRedirectTo: window.location.origin + '/welcome' },
          })
          if (error) {
            post({ type: 'shutap-auth-error', msg: error.message })
            return
          }
          post({ type: 'shutap-auth-magic', msg: 'magic link sent — check your inbox' })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'sign-in failed'
        post({ type: 'shutap-auth-error', msg })
      }
    }

    window.addEventListener('message', onMessage)
    return () => {
      sub.subscription.unsubscribe()
      window.removeEventListener('message', onMessage)
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      src="/shutap/Welcome.dc.html"
      title="Shutap — Welcome"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#1a0a12' }}
    />
  )
}
