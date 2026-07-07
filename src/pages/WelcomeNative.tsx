/* Native React /welcome — orchestrator. Renders the four-step ceremony:
 *   auth (eager)  →  age (lazy)  →  alias (lazy)  →  welcome (lazy)
 * Later steps' code (and their server-fn imports for legal / alias /
 * welcome-email) is fetched only when the user reaches them. */
import { Suspense, lazy, useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useNoIndex } from '@/components/NoIndex'
import { AuthStep } from './welcome/AuthStep'
import { BG, TEXT, EyeMark, SOFT } from './welcome/shared'
import type { AliasResult } from './welcome/AliasStep'

const AgeStep = lazy(() => import('./welcome/AgeStep'))
const AliasStep = lazy(() => import('./welcome/AliasStep'))
const WelcomeEnterStep = lazy(() => import('./welcome/WelcomeEnterStep'))

type Step = 'auth' | 'age' | 'alias' | 'welcome'

function StepFallback() {
  return (
    <div className="wstep" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
      <EyeMark />
      <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 18, color: SOFT }}>
        one sec…
      </div>
    </div>
  )
}

export function WelcomeNativePage() {
  useNoIndex()

  const initialStep: Step = (() => {
    try { if (sessionStorage.getItem('shutap_age_rejected') === '1') return 'age' } catch { /* noop */ }
    return 'auth'
  })()
  const [step, setStep] = useState<Step>(initialStep)
  const [checking, setChecking] = useState(false)
  const [ageBlocked, setAgeBlocked] = useState<boolean>(() => {
    try { return sessionStorage.getItem('shutap_age_rejected') === '1' } catch { return false }
  })
  const [birth, setBirth] = useState<{ day: number; month: number; year: number }>({ day: 1, month: 1, year: new Date().getFullYear() - 30 })
  const [existingAlias, setExistingAlias] = useState<AliasResult | null>(null)
  const [finalAlias, setFinalAlias] = useState<AliasResult | null>(null)

  // On mount: only skip past the auth step when a REAL (non-anonymous) user
  // is signed in. Anonymous pseudonymous sessions must still see the auth sheet.
  useEffect(() => {
    let cancelled = false
    const isAnon = (u: unknown) => Boolean((u as { is_anonymous?: boolean } | undefined)?.is_anonymous)

    const advanceForRealUser = async () => {
      setChecking(true)
      // Lazy-import server-fn modules so cold /welcome doesn't ship them.
      const [{ recordLegalAcceptance }, { getMyAlias }] = await Promise.all([
        import('@/lib/legal.functions'),
        import('@/lib/alias.functions'),
      ])
      void recordLegalAcceptance({ data: {} }).catch(() => {})
      try {
        const existing = await getMyAlias()
        if (cancelled) return
        if (existing?.display_name && existing.birth_year) {
          const a: AliasResult = {
            emotion: existing.emotion || '',
            nation: existing.nation || '',
            creature: existing.creature || '',
            emoji: existing.emoji || '',
            display_name: existing.display_name,
          }
          setExistingAlias(a)
          setFinalAlias(a)
          setStep('welcome')
        } else {
          setStep('age')
        }
      } catch { if (!cancelled) setStep('age') } finally { if (!cancelled) setChecking(false) }
    }

    const run = async () => {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (!data.session || isAnon(data.session.user)) { setStep('auth'); return }
      await advanceForRealUser()
    }
    void run()

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'USER_UPDATED') return
      if (!session || isAnon(session.user)) return
      void advanceForRealUser()
    })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  return (
    <div style={{ background: BG, color: TEXT, minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @keyframes weblink {0%,34%,40%,78%,84%,100%{transform:scaleY(1)}37%,81%{transform:scaleY(.1)}}
        @keyframes wfadeUp {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        @keyframes wslotIn {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .wstep{animation:wfadeUp .4s ease}
        .oauth-btn:hover{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.25)}
      `}</style>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {checking && <StepFallback />}
          {!checking && step === 'auth' && <AuthStep />}
          {!checking && step === 'age' && (
            <Suspense fallback={<StepFallback />}>
              <AgeStep
                ageBlocked={ageBlocked}
                onBlocked={() => setAgeBlocked(true)}
                onConfirm={(b) => { setBirth(b); setStep('alias') }}
              />
            </Suspense>
          )}
          {!checking && step === 'alias' && (
            <Suspense fallback={<StepFallback />}>
              <AliasStep
                birth={birth}
                initial={existingAlias ?? undefined}
                onComplete={(a) => { setFinalAlias(a); setStep('welcome') }}
              />
            </Suspense>
          )}
          {!checking && step === 'welcome' && (
            <Suspense fallback={<StepFallback />}>
              <WelcomeEnterStep displayName={finalAlias?.display_name ?? existingAlias?.display_name ?? 'friend'} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
