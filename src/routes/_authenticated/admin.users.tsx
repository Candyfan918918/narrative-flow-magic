import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { adminListUsers } from '@/lib/admin.functions'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/_authenticated/admin/users')({
  head: () => ({ meta: [{ title: 'Admin · Users — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  component: AdminUsersPage,
})

interface Row {
  user_id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
  provider: string | null
  is_anonymous: boolean
  first_visit_at: string
  last_visit_at: string
  visit_count: number
  last_country: string | null
  last_city: string | null
  alias: { display_name: string; emoji: string } | null
  stats: { spills: number; comments: number; reactions: number }
}

function AdminUsersPage() {
  const navigate = useNavigate()
  const load = useServerFn(adminListUsers)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [q, setQ] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const u = data.session?.user as { is_anonymous?: boolean } | undefined
      if (!data.session || u?.is_anonymous) { navigate({ to: '/welcome' }); return }
      try {
        const r = await load({ data: { q: q || undefined } })
        if (!dead) setRows(r as Row[])
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : 'load failed')
      }
    })()
    return () => { dead = true }
  }, [load, navigate, q])

  return (
    <div style={{ padding: 24, fontFamily: "'Inter',sans-serif", background: '#fdf0f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#0b080f', margin: 0 }}>users</h1>
          <nav style={{ display: 'flex', gap: 12, fontSize: 13 }}>
            <a href="/admin" style={{ color: '#c1216b' }}>← admin</a>
            <a href="/admin/events" style={{ color: '#c1216b' }}>events →</a>
          </nav>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search email or name…"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(11,8,15,.12)', borderRadius: 10, marginBottom: 16 }}
        />
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
                  <th style={th}>user</th>
                  <th style={th}>email</th>
                  <th style={th}>provider</th>
                  <th style={th}>country</th>
                  <th style={th}>city</th>
                  <th style={th}>visits</th>
                  <th style={th}>last seen</th>
                  <th style={th}>spills</th>
                  <th style={th}>comments</th>
                  <th style={th}>reactions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} style={{ borderTop: '.5px solid rgba(11,8,15,.05)' }}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{r.full_name || `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—'}</div>
                      <div style={{ color: '#9e7a8c', fontSize: 12 }}>{r.alias ? `${r.alias.emoji} ${r.alias.display_name}` : '—'}</div>
                    </td>
                    <td style={td}>{r.email || '—'}</td>
                    <td style={td}>{r.provider || (r.is_anonymous ? 'anon' : '—')}</td>
                    <td style={td}>{r.last_country || '—'}</td>
                    <td style={td}>{r.last_city || '—'}</td>
                    <td style={td}>{r.visit_count}</td>
                    <td style={td}>{new Date(r.last_visit_at).toLocaleString()}</td>
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
const td: React.CSSProperties = { padding: '10px 12px', color: '#1b0f16' }
