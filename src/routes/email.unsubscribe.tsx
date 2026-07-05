import { createFileRoute, Link, useServerFn } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { processUnsubscribe, type PrefsDto } from '@/lib/email/prefs.functions'

export const Route = createFileRoute('/email/unsubscribe')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  head: () => ({
    meta: [
      { title: 'unsubscribed · shutap' },
      { name: 'robots', content: 'noindex,nofollow' },
      { name: 'description', content: 'email unsubscribe' },
    ],
  }),
  component: UnsubscribeRoute,
})

function UnsubscribeRoute() {
  const { token } = Route.useSearch()
  const run = useServerFn(processUnsubscribe)
  const [state, setState] = useState<'pending' | PrefsDto>('pending')

  useEffect(() => {
    if (!token) {
      setState({ ok: false })
      return
    }
    run({ data: { token } })
      .then((r) => setState(r))
      .catch(() => setState({ ok: false }))
  }, [token, run])

  const ok = state !== 'pending' && state.ok

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fdfcfb',
        color: '#3b2734',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          background: '#fff8f2',
          border: '1px solid #f0e2d4',
          borderRadius: 16,
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 12px 40px rgba(107, 60, 82, 0.08)',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 8 }}>
          shutap
        </div>
        {state === 'pending' ? (
          <p style={{ color: '#9e7a8c', margin: 0 }}>updating your preferences…</p>
        ) : ok ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: '12px 0 12px' }}>
              you're unsubscribed.
            </h1>
            <p style={{ color: '#6b3c52', lineHeight: 1.6, margin: '0 0 20px' }}>
              transactional and security emails may still arrive — everything else is off.
            </p>
            {state.email ? (
              <p style={{ color: '#9e7a8c', fontSize: 13, margin: '0 0 24px' }}>
                for {state.email}
              </p>
            ) : null}
            <Link
              to="/email/preferences"
              search={{ token }}
              style={{
                display: 'inline-block',
                background: '#6b3c52',
                color: '#fff8f2',
                padding: '12px 22px',
                borderRadius: 999,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              manage preferences instead
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '12px 0 12px' }}>
              this link isn't valid.
            </h1>
            <p style={{ color: '#6b3c52', lineHeight: 1.6, margin: 0 }}>
              the token may have expired or already been used. sign in to manage your email
              preferences directly.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
