import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { adminAnalytics } from '@/lib/admin.functions'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/_authenticated/admin/analytics')({
  head: () => ({ meta: [{ title: 'Admin · Analytics — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminAnalyticsPage,
})

type Analytics = Awaited<ReturnType<typeof adminAnalytics>>

function fmt(d: string | null | undefined): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return '—' }
}

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 14, padding: 16, minWidth: 160 }}>
      <div style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9e7a8c' }}>{label}</div>
      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: '#0b080f', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b4a5c', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ background: '#f4e6ee', borderRadius: 999, height: 8, width: 140, overflow: 'hidden' }}>
      <div style={{ background: '#c1216b', height: '100%', width: `${pct}%` }} />
    </div>
  )
}

function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const load = useServerFn(adminAnalytics)
  const [data, setData] = useState<Analytics | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data: s } = await supabase.auth.getSession()
      const u = s.session?.user as { is_anonymous?: boolean } | undefined
      if (!s.session || u?.is_anonymous) { navigate({ to: '/welcome' }); return }
      try {
        const r = await load({ data: {} })
        if (!dead) setData(r as Analytics)
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : 'load failed')
      }
    })()
    return () => { dead = true }
  }, [load, navigate])

  return (
    <div style={{ padding: 24, fontFamily: "'Inter',sans-serif", background: '#fdf0f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#0b080f', margin: 0 }}>analytics</h1>
          {data && <span style={{ fontSize: 12, color: '#9e7a8c' }}>as of {fmt(data.generated_at)}</span>}
        </div>

        {err && <div style={{ color: '#c1216b', marginBottom: 12 }}>{err}</div>}
        {!data ? (
          <div style={{ color: '#6b4a5c' }}>loading…</div>
        ) : (
          <>
            <section style={{ marginBottom: 24 }}>
              <h2 style={sectionH2}>headline</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Card label="real users" value={data.users.total_real} />
                <Card label="new · 7d" value={data.users.new_7d} />
                <Card label="new · 30d" value={data.users.new_30d} />
                <Card label="dau" value={data.activity.dau} sub="unique users · 24h" />
                <Card label="wau" value={data.activity.wau} sub="unique users · 7d" />
                <Card label="mau" value={data.activity.mau} sub="unique users · 30d" />
                <Card label="total visits" value={data.visits.total} />
                <Card label="visits · 7d" value={data.visits.d7} />
                <Card label="visits · 30d" value={data.visits.d30} sub={`${data.visits.new_30d} new · ${data.visits.returning_30d} returning`} />
                <Card label="guest→sign_up events" value={data.users.guest_converted} />
              </div>
            </section>

            <section style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={panel}>
                <h2 style={sectionH2}>sign-ins by provider</h2>
                <ProviderTable providers={data.providers} />
              </div>
              <div style={panel}>
                <h2 style={sectionH2}>top countries · 30d</h2>
                <CountryTable rows={data.top_countries} />
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <div style={panel}>
                <h2 style={sectionH2}>behavior · events</h2>
                <EventsTable rows={data.events} />
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <div style={panel}>
                <h2 style={sectionH2}>recent sign-ins</h2>
                <RecentTable rows={data.recent_signins} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function ProviderTable({ providers }: { providers: Record<string, number> }) {
  const entries = Object.entries(providers).sort((a, b) => b[1] - a[1])
  const max = entries.reduce((m, [, v]) => Math.max(m, v), 0)
  if (entries.length === 0) return <div style={empty}>no data</div>
  return (
    <table style={table}>
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} style={tr}>
            <td style={{ ...td, width: 120 }}>{k || '—'}</td>
            <td style={td}><Bar value={v} max={max} /></td>
            <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CountryTable({ rows }: { rows: Array<[string, number]> }) {
  if (rows.length === 0) return <div style={empty}>no data</div>
  const max = rows.reduce((m, [, v]) => Math.max(m, v), 0)
  return (
    <table style={table}>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} style={tr}>
            <td style={{ ...td, width: 120 }}>{k}</td>
            <td style={td}><Bar value={v} max={max} /></td>
            <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EventsTable({ rows }: { rows: Array<{ name: string; d7: number; d30: number }> }) {
  if (rows.length === 0) return <div style={empty}>no events yet</div>
  return (
    <table style={table}>
      <thead>
        <tr style={{ background: '#faf3f6', textAlign: 'left', color: '#6b4a5c' }}>
          <th style={th}>event</th>
          <th style={{ ...th, textAlign: 'right' }}>7d</th>
          <th style={{ ...th, textAlign: 'right' }}>30d</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} style={tr}>
            <td style={td}>{r.name}</td>
            <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.d7}</td>
            <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.d30}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function RecentTable({ rows }: { rows: Analytics['recent_signins'] }) {
  if (rows.length === 0) return <div style={empty}>no recent sign-ins</div>
  return (
    <table style={table}>
      <thead>
        <tr style={{ background: '#faf3f6', textAlign: 'left', color: '#6b4a5c' }}>
          <th style={th}>user</th>
          <th style={th}>email</th>
          <th style={th}>provider</th>
          <th style={th}>when</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.user_id} style={tr}>
            <td style={td}>{r.full_name || `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—'}</td>
            <td style={td}>{r.email || '—'}</td>
            <td style={td}>{r.provider || '—'}</td>
            <td style={td}>{fmt(r.last_login_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const sectionH2: React.CSSProperties = { fontFamily: "'Sora',sans-serif", fontSize: 15, fontWeight: 700, color: '#0b080f', margin: '0 0 12px 0', letterSpacing: '.02em' }
const panel: React.CSSProperties = { background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 14, padding: 16, overflow: 'auto' }
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const th: React.CSSProperties = { padding: '10px 12px', fontWeight: 600, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }
const td: React.CSSProperties = { padding: '10px 12px', color: '#1b0f16' }
const tr: React.CSSProperties = { borderTop: '.5px solid rgba(11,8,15,.05)' }
const empty: React.CSSProperties = { color: '#9e7a8c', fontStyle: 'italic', padding: '8px 4px', fontSize: 13 }
