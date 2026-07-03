import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { adminListUsers } from '@/lib/admin.functions'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/_authenticated/admin/users')({
  head: () => ({ meta: [{ title: 'Admin · Users — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminUsersPage,
})

type SortCol = 'last_visit_at' | 'last_login_at' | 'signup_at' | 'visit_count' | 'login_count' | 'email'

interface Row {
  user_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  provider: string | null
  is_anonymous: boolean
  signup_at: string | null
  first_visit_at: string
  last_visit_at: string
  last_login_at: string | null
  login_count: number
  visit_count: number
  last_country: string | null
  last_city: string | null
  alias: { display_name: string; emoji: string } | null
  stats: { spills: number; comments: number; reactions: number }
}

function fmt(d: string | null | undefined): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return '—' }
}

function AdminUsersPage() {
  const navigate = useNavigate()
  const load = useServerFn(adminListUsers)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [q, setQ] = useState('')
  const [includeAnon, setIncludeAnon] = useState(false)
  const [sort, setSort] = useState<SortCol>('last_visit_at')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const u = data.session?.user as { is_anonymous?: boolean } | undefined
      if (!data.session || u?.is_anonymous) { navigate({ to: '/welcome' }); return }
      try {
        const r = await load({ data: { q: q || undefined, include_anonymous: includeAnon, sort, dir } })
        if (!dead) setRows(r as Row[])
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : 'load failed')
      }
    })()
    return () => { dead = true }
  }, [load, navigate, q, includeAnon, sort, dir])

  function toggleSort(col: SortCol) {
    if (sort === col) setDir(dir === 'desc' ? 'asc' : 'desc')
    else { setSort(col); setDir('desc') }
  }

  const sortableCols = useMemo(() => new Set<SortCol>(['last_visit_at', 'last_login_at', 'signup_at', 'visit_count', 'login_count', 'email']), [])

  const SortableTh = ({ col, label }: { col: SortCol; label: string }) => (
    <th
      style={{ ...th, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => toggleSort(col)}
      title="sort"
    >
      {label} {sort === col ? (dir === 'desc' ? '↓' : '↑') : ''}
    </th>
  )
  const Th = ({ col, label }: { col: SortCol | string; label: string }) =>
    typeof col === 'string' && !sortableCols.has(col as SortCol)
      ? <th style={th}>{label}</th>
      : <SortableTh col={col as SortCol} label={label} />

  return (
    <div style={{ padding: 24, fontFamily: "'Inter',sans-serif", background: '#fdf0f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#0b080f', margin: 0 }}>users</h1>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search email or name…"
            style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(11,8,15,.12)', borderRadius: 10 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b4a5c', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={includeAnon} onChange={(e) => setIncludeAnon(e.target.checked)} />
            show guests
          </label>
        </div>
        {err && <div style={{ color: '#c1216b', marginBottom: 12 }}>{err}</div>}
        {!rows ? (
          <div style={{ color: '#6b4a5c' }}>loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: '#6b4a5c', fontStyle: 'italic' }}>no users yet</div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '.5px solid rgba(11,8,15,.08)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#faf3f6', textAlign: 'left', color: '#6b4a5c' }}>
                  <Th col="email" label="email" />
                  <Th col="first_name" label="first" />
                  <Th col="last_name" label="last" />
                  <Th col="provider" label="provider" />
                  <Th col="signup_at" label="signup" />
                  <Th col="last_login_at" label="last login" />
                  <Th col="last_visit_at" label="last use" />
                  <Th col="login_count" label="logins" />
                  <Th col="visit_count" label="visits" />
                  <Th col="country" label="country" />
                  <Th col="city" label="city" />
                  <Th col="spills" label="spills" />
                  <Th col="comments" label="comments" />
                  <Th col="reactions" label="reactions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} style={{ borderTop: '.5px solid rgba(11,8,15,.05)' }}>
                    <td style={td}>{r.email || (r.is_anonymous ? <span style={{ color: '#9e7a8c' }}>guest</span> : '—')}</td>
                    <td style={td}>{r.first_name || '—'}</td>
                    <td style={td}>{r.last_name || '—'}</td>
                    <td style={td}>{r.provider || (r.is_anonymous ? 'anon' : '—')}</td>
                    <td style={td}>{fmt(r.signup_at)}</td>
                    <td style={td}>{fmt(r.last_login_at)}</td>
                    <td style={td}>{fmt(r.last_visit_at)}</td>
                    <td style={td}>{r.login_count}</td>
                    <td style={td}>{r.visit_count}</td>
                    <td style={td}>{r.last_country || '—'}</td>
                    <td style={td}>{r.last_city || '—'}</td>
                    <td style={td}>{r.stats.spills}</td>
                    <td style={td}>{r.stats.comments}</td>
                    <td style={td}>{r.stats.reactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 12px', fontWeight: 600, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }
const td: React.CSSProperties = { padding: '10px 12px', color: '#1b0f16', whiteSpace: 'nowrap' }
