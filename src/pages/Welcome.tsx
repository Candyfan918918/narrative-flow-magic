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

  // Inject a click/submit bridge into the bundler-unpacked document so that
  // any "Google"/"Apple"/"email" affordance routes through parent auth.
  const onLoad = () => {
    const tryInject = (attempt = 0) => {
      const doc = iframeRef.current?.contentDocument
      if (!doc || !doc.body) {
        if (attempt < 40) setTimeout(() => tryInject(attempt + 1), 150)
        return
      }
      if (doc.getElementById('__shutap_bridge')) return
      const s = doc.createElement('script')
      s.id = '__shutap_bridge'
      s.textContent = `(() => {
        const post = (m) => { try { parent.postMessage(m, '*') } catch(e){} };
        const matchMethod = (el) => {
          const t = ((el.innerText || el.textContent || '') + ' ' + (el.getAttribute('aria-label')||'')).toLowerCase();
          if (/google/.test(t)) return 'google';
          if (/apple/.test(t)) return 'apple';
          return null;
        };
        document.addEventListener('click', (e) => {
          let n = e.target;
          while (n && n !== document.body) {
            if (n.tagName === 'BUTTON' || n.tagName === 'A' || n.getAttribute?.('role') === 'button') {
              const m = matchMethod(n);
              if (m) { e.preventDefault(); post({ type: 'shutap-auth', method: m }); return; }
            }
            n = n.parentNode;
          }
        }, true);
        document.addEventListener('submit', (e) => {
          const form = e.target;
          const input = form.querySelector?.('input[type=email], input[name*=email i]');
          if (input && input.value) { e.preventDefault(); post({ type: 'shutap-auth', method: 'email', email: input.value }); }
        }, true);
        window.addEventListener('message', (ev) => {
          const d = ev.data || {};
          if (d.type === 'shutap-auth-magic' || d.type === 'shutap-auth-error') {
            const el = document.createElement('div');
            el.textContent = d.msg || '';
            el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#2e0a1a;color:#fcf1f5;padding:10px 18px;border-radius:999px;font:14px -apple-system,sans-serif;z-index:99999;box-shadow:0 6px 24px rgba(0,0,0,.3)';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 4000);
          }
        });
      })();`
      doc.body.appendChild(s)
    }
    tryInject()
  }

  return (
    <iframe
      ref={iframeRef}
      src="/shutap/Welcome.dc.html"
      title="Shutap — Welcome"
      onLoad={onLoad}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#fcf1f5' }}
    />
  )
}

