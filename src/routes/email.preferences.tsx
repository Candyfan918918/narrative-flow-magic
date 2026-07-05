import { createFileRoute, useServerFn } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { loadPrefs, savePrefs, type PrefsDto } from '@/lib/email/prefs.functions'

export const Route = createFileRoute('/email/preferences')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  head: () => ({
    meta: [
      { title: 'email preferences · shutap' },
      { name: 'robots', content: 'noindex,nofollow' },
      { name: 'description', content: 'manage your shutap email preferences' },
    ],
  }),
  component: PreferencesRoute,
})

type GroupKey = 'notif_checkins_opt_out' | 'notif_community_opt_out' | 'notif_digest_opt_out'

const GROUPS: { key: GroupKey; title: string; desc: string }[] = [
  {
    key: 'notif_checkins_opt_out',
    title: 'check-ins',
    desc: 'the day 1 / 2 / 3 / 7 / 14 / 30 follow-ups after you spill.',
  },
  {
    key: 'notif_community_opt_out',
    title: 'community updates',
    desc: 'when someone replies to your room, or your spill hits a milestone.',
  },
  {
    key: 'notif_digest_opt_out',
    title: 'digests & highlights',
    desc: 'weekly digest, popular today, hall updates, and re-engagement notes.',
  },
]

function PreferencesRoute() {
  const { token } = Route.useSearch()
  const load = useServerFn(loadPrefs)
  const save = useServerFn(savePrefs)
  const [state, setState] = useState<'pending' | PrefsDto>('pending')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!token) {
      setState({ ok: false })
      return
    }
    load({ data: { token } })
      .then((r) => setState(r))
      .catch(() => setState({ ok: false }))
  }, [token, load])

  async function toggle(key: GroupKey, nextValue: boolean) {
    if (state === 'pending' || !state.ok || !state.prefs) return
    const nextPrefs = { ...state.prefs, [key]: nextValue }
    setState({ ...state, prefs: nextPrefs })
    setSaving(true)
    setSaved(false)
    try {
      const r = await save({ data: { token, [key]: nextValue } })
      if (r.ok) {
        setState(r)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fdfcfb',
        color: '#3b2734',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          background: '#fff8f2',
          border: '1px solid #f0e2d4',
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: '0 12px 40px rgba(107, 60, 82, 0.08)',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>shutap</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 4px' }}>email preferences</h1>
        {state !== 'pending' && state.ok && state.email ? (
          <p style={{ color: '#9e7a8c', fontSize: 13, margin: '0 0 24px' }}>for {state.email}</p>
        ) : (
          <p style={{ color: '#9e7a8c', fontSize: 13, margin: '0 0 24px' }}>
            choose what shows up in your inbox.
          </p>
        )}

        {state === 'pending' ? (
          <p style={{ color: '#9e7a8c' }}>loading…</p>
        ) : !state.ok || !state.prefs ? (
          <div>
            <p style={{ lineHeight: 1.6, margin: '0 0 20px' }}>
              this link isn't valid or has expired. sign in to manage your email preferences.
            </p>
            <a
              href="/auth?next=/email/preferences"
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
              sign in
            </a>
          </div>
        ) : (
          <>
            {state.prefs.notif_all_opt_out ? (
              <div
                style={{
                  background: '#f6ecdf',
                  border: '1px solid #e6d3bd',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 13,
                  color: '#6b3c52',
                  marginBottom: 20,
                }}
              >
                you unsubscribed from all optional email. toggle any group back on below to resume it.
              </div>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {GROUPS.map((g) => {
                const off = Boolean(state.prefs?.[g.key])
                return (
                  <label
                    key={g.key}
                    style={{
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                      padding: '14px 16px',
                      background: '#fdfcfb',
                      border: '1px solid #f0e2d4',
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!off}
                      onChange={(e) => toggle(g.key, !e.target.checked)}
                      disabled={saving}
                      style={{ marginTop: 3, accentColor: '#6b3c52' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{g.title}</div>
                      <div style={{ color: '#6b3c52', fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>
                        {g.desc}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            <div style={{ marginTop: 22, minHeight: 20, fontSize: 13, color: '#9e7a8c' }}>
              {saving ? 'saving…' : saved ? 'saved.' : ''}
            </div>

            <p style={{ marginTop: 24, fontSize: 12, color: '#9e7a8c', lineHeight: 1.6 }}>
              transactional and security emails (magic links, account notices) always arrive.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
