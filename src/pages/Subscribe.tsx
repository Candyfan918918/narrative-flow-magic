import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from '@/compat/router'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { useServerFn } from '@tanstack/react-start'
import { getStripe, getStripeEnvironment } from '@/lib/stripe'
import { createMirrorCheckout, createMirrorPortal } from '@/lib/payments.functions'
import { getMyBillingStatus } from '@/lib/billing.functions'
import { supabase } from '@/integrations/supabase/client'
import { useNoIndex } from '@/components/NoIndex'

const PLAN_TO_PRICE: Record<string, { id: string; label: string; price: string }> = {
  monthly: { id: 'mirror_monthly', label: 'monthly', price: '$6/month' },
  annual:  { id: 'mirror_annual',  label: 'annual',  price: '$49/year'  },
}

export function SubscribePage() {
  useNoIndex()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const planKey = (search.get('plan') === 'monthly' ? 'monthly' : 'annual') as 'monthly' | 'annual'
  const plan = PLAN_TO_PRICE[planKey]
  const [err, setErr] = useState<string | null>(null)
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [checked, setChecked] = useState(false)
  const [alreadySubbed, setAlreadySubbed] = useState(false)
  const [portalBusy, setPortalBusy] = useState(false)

  const fetchStatus = useServerFn(getMyBillingStatus)
  const openPortalFn = useServerFn(createMirrorPortal)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
  }, [])

  useEffect(() => {
    if (authed === false) {
      navigate('/welcome', { replace: true })
    }
  }, [authed, navigate])

  // Duplicate-subscription guard: if the user already has an active row,
  // stop rendering checkout and offer the portal instead.
  useEffect(() => {
    if (!authed) return
    let done = false
    ;(async () => {
      try {
        const s = await fetchStatus({ data: { environment: getStripeEnvironment() } })
        if (done) return
        if (s?.isActive) setAlreadySubbed(true)
      } catch { /* treat as not subscribed */ }
      finally { if (!done) setChecked(true) }
    })()
    return () => { done = true }
  }, [authed, fetchStatus])

  async function openPortal() {
    setPortalBusy(true)
    try {
      const result = await openPortalFn({
        data: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/profile` },
      })
      if ('error' in result) throw new Error(result.error)
      window.location.href = result.url
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not open billing portal')
      setPortalBusy(false)
    }
  }

  const fetchClientSecret = async (): Promise<string> => {
    try {
      const result = await createMirrorCheckout({
        data: {
          priceId: plan.id,
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/subscribe/return?session_id={CHECKOUT_SESSION_ID}`,
        },
      })
      if ('error' in result) throw new Error(result.error)
      if (!result.clientSecret) throw new Error('No client secret returned')
      return result.clientSecret
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not start checkout'
      setErr(msg)
      throw e
    }
  }

  if (authed === null || (authed && !checked)) return null

  return (
    <div style={{ minHeight: '100vh', background: '#1a0a12', color: '#f7e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '28px 20px 80px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: '#caaebb', fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 18 }}
        >
          ← back
        </button>
        <div style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 26, lineHeight: 1.3, marginBottom: 8 }}>
          open the full mirror
        </div>
        <div style={{ color: '#caaebb', fontSize: 14.5, lineHeight: 1.55, marginBottom: 18 }}>
          {plan.label} · {plan.price} · 7 days free
        </div>
        {alreadySubbed ? (
          <div style={{ background: 'rgba(255,255,255,.04)', border: '.5px solid rgba(247,232,240,.16)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 18, lineHeight: 1.4 }}>
              you're already subscribed.
            </div>
            <div style={{ color: '#caaebb', fontSize: 14, lineHeight: 1.5 }}>
              manage plan, update payment method, or cancel from your billing portal.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={openPortal}
                disabled={portalBusy}
                style={{ background: '#e7548a', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 18px', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
              >
                {portalBusy ? 'opening…' : 'manage billing →'}
              </button>
              <button
                onClick={() => navigate('/mirror')}
                style={{ background: 'transparent', color: '#caaebb', border: '.5px solid rgba(247,232,240,.24)', borderRadius: 999, padding: '10px 18px', fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
              >
                go to mirror →
              </button>
            </div>
            {err && (
              <div style={{ color: '#f7b8d4', fontSize: 13 }}>{err}</div>
            )}
          </div>
        ) : err ? (
          <div style={{ background: 'rgba(231,84,138,.12)', border: '.5px solid rgba(231,84,138,.32)', borderRadius: 12, padding: 14, color: '#f7b8d4', fontSize: 13.5 }}>
            {err}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  )
}

export function SubscribeReturnPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = search.get('session_id')
  const [state, setState] = useState<'checking' | 'ok' | 'missing' | 'incomplete'>('checking')

  const fetchStatus = useServerFn(getMyBillingStatus)

  useEffect(() => {
    if (!sessionId) { setState('missing'); return }
    let cancelled = false
    // Poll billing status briefly — webhook may land a moment after redirect.
    const started = Date.now()
    const check = async () => {
      try {
        const s = await fetchStatus({ data: { environment: getStripeEnvironment() } })
        if (cancelled) return
        if (s?.isActive) { setState('ok'); return }
      } catch { /* keep polling */ }
      if (Date.now() - started > 8000) {
        if (!cancelled) setState('incomplete')
        return
      }
      setTimeout(check, 1000)
    }
    void check()
    return () => { cancelled = true }
  }, [sessionId, fetchStatus])

  const title = state === 'ok' ? 'the mirror is open.'
    : state === 'checking' ? 'confirming your subscription…'
    : state === 'incomplete' ? 'we couldn\'t confirm your subscription yet.'
    : 'no checkout session found.'
  const body = state === 'ok' ? 'your 7-day free trial has started. you can manage or cancel anytime from your profile.'
    : state === 'checking' ? 'one moment while stripe finalizes.'
    : state === 'incomplete' ? 'if you completed payment, it should appear on your profile within a minute. otherwise, try again.'
    : 'try starting checkout again.'

  return (
    <div style={{ minHeight: '100vh', background: '#1a0a12', color: '#f7e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 28, lineHeight: 1.3, marginBottom: 14 }}>
          {title}
        </div>
        <div style={{ color: '#caaebb', fontSize: 14.5, lineHeight: 1.55, marginBottom: 24 }}>
          {body}
        </div>
        <button
          onClick={() => navigate('/profile')}
          style={{ background: '#e7548a', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 22px', fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          go to profile →
        </button>
      </div>
    </div>
  )
}
