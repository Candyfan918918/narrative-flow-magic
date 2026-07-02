import { useEffect, useRef } from 'react'
import { lovable } from '@/integrations/lovable'
import { supabase } from '@/integrations/supabase/client'
import { recordLegalAcceptance } from '@/lib/legal.functions'
import { upsertMyAlias } from '@/lib/alias.functions'
import { useNoIndex } from '@/components/NoIndex'

/* Pixel-perfect iframe of the Welcome prototype, with real auth wired through
   postMessage so Google/Apple/email actually authenticate via Lovable Cloud,
   and the minted alias persists into public.aliases. */
export function WelcomePage() {
  useNoIndex()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const resume = () => {
      try {
        const pc = sessionStorage.getItem('shutap_pending_comment')
        if (pc) {
          const parsed = JSON.parse(pc) as { roomId?: string }
          if (parsed?.roomId) {
            window.location.replace('/room?id=' + encodeURIComponent(parsed.roomId))
            return true
          }
        }
        if (sessionStorage.getItem('shutap_pending_save')) {
          window.location.replace('/')
          return true
        }
      } catch { /* noop */ }
      return false
    }

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
        try { sessionStorage.setItem('shutap_authed', '1') } catch {}
        recordLegalAcceptance({ data: {} }).catch(() => {})
        // Nudge iframe to skip the auth step.
        try { iframeRef.current?.contentWindow?.postMessage({ type: 'shutap-authed' }, '*') } catch {}
      }
    })

    const post = (msg: unknown) => {
      iframeRef.current?.contentWindow?.postMessage(msg, '*')
    }

    const onMessage = async (e: MessageEvent) => {
      const data = e.data as {
        type?: string; method?: string; email?: string;
        alias?: { emotion?: string; nation?: string; creature?: string; emoji?: string; display_name?: string };
        birth?: { year?: number; month?: number; day?: number };
      } | null
      if (!data || !data.type) return

      if (data.type === 'shutap-alias-mint') {
        // Persist minted alias + birth into public.aliases (requires a real session).
        try {
          const { data: sess } = await supabase.auth.getSession()
          if (!sess.session) { post({ type: 'shutap-alias-error', msg: 'sign in first' }); return }
          const a = data.alias ?? {}
          const b = data.birth ?? {}
          const saved = await upsertMyAlias({ data: {
            emotion: a.emotion,
            nation: a.nation,
            creature: a.creature,
            emoji: a.emoji,
            display_name: a.display_name,
            birth_year: b.year,
            birth_month: b.month,
            birth_day: b.day,
          } })
          try {
            localStorage.setItem('shutap_alias', JSON.stringify({
              name: (saved as { display_name?: string })?.display_name,
              emoji: (saved as { emoji?: string })?.emoji,
            }))
          } catch { /* noop */ }
          await recordLegalAcceptance({ data: {} }).catch(() => {})
          post({ type: 'shutap-alias-saved' })
          // Nothing else to do — iframe will show step-welcome; the resume runs on the enter click.
          setTimeout(() => resume(), 250)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'save failed'
          post({ type: 'shutap-alias-error', msg })
        }
        return
      }

      if (data.type !== 'shutap-auth') return
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

  // Inject a click/submit bridge. The unpacker replaces documentElement after
  // load, which nukes any script we injected during onLoad, so we poll and
  // re-inject whenever the marker is missing.
  const onLoad = () => {
    const bridgeSrc = `(() => {
      if (window.__shutap_bridge_installed) return;
      window.__shutap_bridge_installed = true;
      const post = (m) => { try { parent.postMessage(m, '*') } catch(e){} };

      // If parent flagged an active session, skip step-auth.
      try {
        if (sessionStorage.getItem('shutap_authed') === '1') {
          setTimeout(() => {
            document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
            const s = document.getElementById('step-age');
            if (s) s.classList.add('active');
          }, 50);
        }
      } catch(e){}

      const matchMethod = (el) => {
        const t = ((el.innerText || el.textContent || '') + ' ' + (el.getAttribute('aria-label')||'')).toLowerCase();
        if (/google/.test(t)) return 'google';
        if (/apple/.test(t)) return 'apple';
        // Email 'go →' or 'continue with email' button — resolve email input value.
        if (/^(go|continue|continue with email|send|→|sign in)$/i.test(t.trim()) || /email/.test(t)) return 'email';
        return null;
      };

      const findEmailInput = (root) => {
        return (root || document).querySelector('input[type=email], input[name*=email i]');
      };

      const fireEmail = (btnEl) => {
        // Only fire from step-auth to avoid intercepting other buttons.
        const step = document.querySelector('.step.active');
        if (step && step.id && step.id !== 'step-auth') return false;
        const input = findEmailInput(step || document);
        const val = (input && input.value || '').trim();
        if (!val || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(val)) {
          post({ type: 'shutap-auth-error', msg: 'enter a valid email' });
          return true;
        }
        post({ type: 'shutap-auth', method: 'email', email: val });
        return true;
      };

      document.addEventListener('click', (e) => {
        let n = e.target;
        while (n && n !== document.body) {
          if (n.tagName === 'BUTTON' || n.tagName === 'A' || n.getAttribute?.('role') === 'button') {
            const m = matchMethod(n);
            if (m === 'google' || m === 'apple') {
              e.preventDefault(); post({ type: 'shutap-auth', method: m }); return;
            }
            if (m === 'email') {
              // Only intercept email click if inside step-auth and near an email input.
              const step = document.querySelector('.step.active');
              if (step && step.id === 'step-auth') {
                e.preventDefault();
                fireEmail(n);
                return;
              }
            }
          }
          n = n.parentNode;
        }
      }, true);

      document.addEventListener('submit', (e) => {
        const form = e.target;
        const input = form.querySelector?.('input[type=email], input[name*=email i]');
        if (input && input.value) { e.preventDefault(); post({ type: 'shutap-auth', method: 'email', email: input.value }); }
      }, true);

      // ── Alias-mint hook ──
      // The prototype's keepAlias() stashes the alias into localStorage before
      // advancing to step-welcome. We watch for the alias to appear and forward
      // it to the parent for DB persistence. Also resolves the birth date from
      // the age wheels if they're still on the DOM.
      const readBirth = () => {
        const centre = (el) => {
          if (!el) return null;
          const c = el.scrollTop + 80;
          let best=null, bd=Infinity;
          el.querySelectorAll('[data-val]').forEach(d => { const m=Math.abs(d.offsetTop+20-c); if(m<bd){bd=m;best=d.dataset.val;} });
          return best;
        };
        const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const dayEl = document.querySelector('#step-age [ref], #step-age div[style*="width:70px"]');
        // Fallback: read from any element the wheels were built on
        const wheels = document.querySelectorAll('#step-age div[style*="scroll-snap-type"]');
        const day = wheels[0] ? parseInt(centre(wheels[0])||'1',10) : null;
        const mon = wheels[1] ? centre(wheels[1]) : null;
        const yr  = wheels[2] ? parseInt(centre(wheels[2])||'0',10) : null;
        return {
          day: isNaN(day) ? null : day,
          month: mon ? M.indexOf(mon)+1 : null,
          year: isNaN(yr) ? null : yr,
        };
      };
      let lastAliasSent = '';
      const trySendAlias = () => {
        try {
          const raw = localStorage.getItem('shutap_alias');
          if (!raw || raw === lastAliasSent) return;
          const parsed = JSON.parse(raw);
          if (!parsed || !parsed.name) return;
          lastAliasSent = raw;
          // Parse name back into parts: "Emotion Nation Creature"
          const parts = String(parsed.name).split(' ');
          const emotion = parts[0], nation = parts[1], creature = parts.slice(2).join(' ');
          const b = readBirth();
          post({
            type: 'shutap-alias-mint',
            alias: { emotion, nation, creature, emoji: parsed.emoji, display_name: parsed.name },
            birth: b,
          });
        } catch(e){}
      };
      setInterval(trySendAlias, 700);

      window.addEventListener('message', (ev) => {
        const d = ev.data || {};
        if (d.type === 'shutap-authed') {
          document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
          const s = document.getElementById('step-age');
          if (s) s.classList.add('active');
        }
        if (d.type === 'shutap-auth-magic' || d.type === 'shutap-auth-error' || d.type === 'shutap-alias-error') {
          const el = document.createElement('div');
          el.textContent = d.msg || '';
          el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#2e0a1a;color:#fcf1f5;padding:10px 18px;border-radius:999px;font:14px -apple-system,sans-serif;z-index:99999;box-shadow:0 6px 24px rgba(0,0,0,.3)';
          (document.body || document.documentElement).appendChild(el);
          setTimeout(() => el.remove(), 4000);
        }
      });
    })();`

    const inject = () => {
      const win = iframeRef.current?.contentWindow as (Window & { __shutap_bridge_installed?: boolean }) | null
      const doc = iframeRef.current?.contentDocument
      if (!win || !doc || !doc.body) return
      if (win.__shutap_bridge_installed) return
      const s = doc.createElement('script')
      s.textContent = bridgeSrc
      doc.body.appendChild(s)
    }

    let ticks = 0
    const iv = window.setInterval(() => {
      ticks++
      inject()
      if (ticks > 80) window.clearInterval(iv)
    }, 250)
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
