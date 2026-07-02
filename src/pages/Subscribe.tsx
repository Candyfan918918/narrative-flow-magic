import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { getStripe, getStripeEnvironment } from '@/lib/stripe'
import { createMirrorCheckout } from '@/lib/payments.functions'
import { supabase } from '@/integrations/supabase/client'
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner'
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
  }, [])

  useEffect(() => {
    if (authed === false) {
      navigate('/welcome', { replace: true })
    }
  }, [authed, navigate])

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

  if (authed === null) return null

  return (
    <div style={{ minHeight: '100vh', background: '#1a0a12', color: '#f7e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <PaymentTestModeBanner />
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
        {err ? (
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
  return (
    <div style={{ minHeight: '100vh', background: '#1a0a12', color: '#f7e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', fontSize: 28, lineHeight: 1.3, marginBottom: 14 }}>
          {sessionId ? 'the mirror is open.' : 'no checkout session found.'}
        </div>
        <div style={{ color: '#caaebb', fontSize: 14.5, lineHeight: 1.55, marginBottom: 24 }}>
          {sessionId ? 'your 7-day free trial has started. you can manage or cancel anytime from your profile.' : 'try starting checkout again.'}
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
