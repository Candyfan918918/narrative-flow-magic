// Real React profile page (replaces the prototype iframe).
// Lists user's spills/scans/journals with owner controls (edit, move, delete).
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { supabase } from '@/integrations/supabase/client'
import { listMySituations } from '@/lib/situations.functions'
import { createMirrorPortal } from '@/lib/payments.functions'
import { getStripeEnvironment } from '@/lib/stripe'
import { SituationEditor } from '@/components/SituationEditor'

type Row = Awaited<ReturnType<typeof listMySituations>>[number]

type Tab = 'all' | 'rooms' | 'journal' | 'scans'

export function ProfilePage() {
  const navigate = useNavigate()
  const list = useServerFn(listMySituations)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [editing, setEditing] = useState<Row | null>(null)
  const [aliasName, setAliasName] = useState<string>('someone')
  const [aliasEmoji, setAliasEmoji] = useState<string>('🌸')

  const refresh = useCallback(async () => {
    try {
      const r = await list()
      setRows(r as Row[])
    } finally { setLoading(false) }
  }, [list])

  useEffect(() => {
    void refresh()
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.rpc('alias_public', { _user_id: user.id })
      if (data && data[0]) {
        setAliasName(data[0].display_name ?? 'someone')
        setAliasEmoji(data[0].emoji ?? '🌸')
      }
    })()
  }, [refresh])

  // hash-jump support (e.g. /profile#journal)
  useEffect(() => {
    const h = window.location.hash.replace('#', '')
    if (h === 'journal' || h === 'rooms' || h === 'scans') setTab(h as Tab)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/welcome')
  }

  async function handleManageSub() {
    try {
      const r = await createMirrorPortal({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.origin + '/profile' },
      })
      if ('url' in r) window.open(r.url, '_blank')
    } catch {}
  }

  const filtered = rows.filter((r) => {
    if (tab === 'all') return true
    if (tab === 'rooms') return r.is_public
    if (tab === 'journal') return !r.is_public && r.kind !== 'scan'
    if (tab === 'scans') return r.kind === 'scan'
    return true
  })

  return (
    <div style={pageWrap}>
      <header style={topBar}>
        <button style={backBtn} onClick={() => navigate('/')}>← home</button>
        <span style={brand}>shutap</span>
        <button style={backBtn} onClick={handleSignOut}>sign out</button>
      </header>

      <section style={hero}>
        <div style={avatar}>{aliasEmoji}</div>
        <div>
          <div style={aliasLabel}>your alias</div>
          <div style={aliasNameStyle}>{aliasName}</div>
          <div style={aliasNote}>no real name. no email shown. just a corner of you.</div>
        </div>
      </section>

      <nav style={tabs}>
        {(['all', 'rooms', 'journal', 'scans'] as Tab[]).map((t) => (
          <button
            key={t}
            style={{ ...tabBtn, ...(tab === t ? tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t} <span style={tabCount}>{rows.filter((r) => {
              if (t === 'all') return true
              if (t === 'rooms') return r.is_public
              if (t === 'journal') return !r.is_public && r.kind !== 'scan'
              if (t === 'scans') return r.kind === 'scan'
              return true
            }).length}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <p style={emptyMsg}>loading…</p>
      ) : filtered.length === 0 ? (
        <div style={emptyState}>
          <p style={emptyMsg}>nothing here yet.</p>
          <button style={primaryBtn} onClick={() => navigate('/')}>spill or scan →</button>
        </div>
      ) : (
        <ul style={cardList}>
          {filtered.map((row) => (
            <li key={row.id} style={card}>
              <div style={cardHead}>
                <span style={pillarChip}>{row.pillar}</span>
                <span style={visibilityChip(row.is_public)}>{row.is_public ? '◯ room' : '◐ journal'}</span>
                {row.edited && <span style={editedChip}>edited</span>}
                <span style={dateChip}>{formatDate(row.created_at)}</span>
              </div>
              <h3 style={cardTitle}>{row.title ?? deriveLocalTitle(row.body ?? row.clean_text)}</h3>
              <p style={cardBody}>{truncate(row.body ?? row.clean_text, 240)}</p>
              <div style={cardActions}>
                <button style={ghostBtn} onClick={() => setEditing(row as Row)}>edit</button>
                {row.is_public && row.room_id && (
                  <button style={ghostBtn} onClick={() => navigate(`/stream#room-${row.room_id}`)}>open room</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section style={subSection}>
        <h2 style={subHeader}>mirror subscription</h2>
        <p style={subBody}>the deeper companion. unlimited mirror chats + memory.</p>
        <div style={subRow}>
          <button style={primaryBtn} onClick={() => navigate('/subscribe?plan=monthly')}>start trial</button>
          <button style={ghostBtn} onClick={handleManageSub}>manage</button>
        </div>
      </section>

      {editing && (
        <SituationEditor
          situation={editing as never}
          onClose={() => setEditing(null)}
          onSaved={() => { void refresh() }}
        />
      )}
    </div>
  )
}

// ----- helpers -----
function truncate(s: string | null, n: number) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s
}
function deriveLocalTitle(body: string | null): string {
  if (!body) return '(no title)'
  const first = body.split(/[.\n!?]/)[0].trim()
  return first.slice(0, 60) || '(no title)'
}
function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch { return '' }
}

// ----- styles -----
const pageWrap: React.CSSProperties = {
  minHeight: '100vh', background: '#fdf0f5', color: '#0b080f',
  fontFamily: '-apple-system, "Sora", system-ui, sans-serif',
  padding: '0 0 60px',
}
const topBar: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '16px 20px', borderBottom: '1px solid #f3cad7',
}
const brand: React.CSSProperties = { fontWeight: 600, color: '#c1216b', letterSpacing: '.02em' }
const backBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#7a4458', cursor: 'pointer', fontSize: 14,
}
const hero: React.CSSProperties = {
  display: 'flex', gap: 16, padding: '24px 20px', alignItems: 'center', maxWidth: 720, margin: '0 auto',
}
const avatar: React.CSSProperties = {
  width: 64, height: 64, borderRadius: '50%', background: '#fff',
  display: 'grid', placeItems: 'center', fontSize: 30, boxShadow: '0 2px 10px rgba(11,8,15,.08)',
}
const aliasLabel: React.CSSProperties = { fontSize: 11, color: '#c1216b', textTransform: 'lowercase', letterSpacing: '.05em' }
const aliasNameStyle: React.CSSProperties = { fontFamily: '"Newsreader", Georgia, serif', fontSize: 26, fontStyle: 'italic' }
const aliasNote: React.CSSProperties = { fontSize: 12, color: '#7a4458', marginTop: 4 }
const tabs: React.CSSProperties = {
  display: 'flex', gap: 8, padding: '0 20px', maxWidth: 720, margin: '0 auto 14px', overflowX: 'auto',
}
const tabBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 999, border: '1px solid #f3cad7', background: '#fff',
  color: '#7a4458', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', textTransform: 'lowercase',
}
const tabActive: React.CSSProperties = { background: '#e7548a', color: '#fff', borderColor: '#e7548a' }
const tabCount: React.CSSProperties = { opacity: .7, marginLeft: 4 }
const cardList: React.CSSProperties = {
  listStyle: 'none', padding: '0 20px', margin: '0 auto', maxWidth: 720, display: 'grid', gap: 12,
}
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(11,8,15,.06)',
}
const cardHead: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }
const pillarChip: React.CSSProperties = {
  fontSize: 11, padding: '2px 8px', borderRadius: 999, background: '#fde7ec', color: '#c1216b', textTransform: 'lowercase',
}
const visibilityChip = (pub: boolean): React.CSSProperties => ({
  fontSize: 11, padding: '2px 8px', borderRadius: 999,
  background: pub ? '#e7f4ed' : '#fff7e2', color: pub ? '#1f7a4b' : '#8a5a1a',
})
const editedChip: React.CSSProperties = { fontSize: 11, color: '#7a4458' }
const dateChip: React.CSSProperties = { fontSize: 11, color: '#7a4458', marginLeft: 'auto' }
const cardTitle: React.CSSProperties = { margin: '4px 0 6px', fontSize: 17, fontWeight: 600 }
const cardBody: React.CSSProperties = {
  fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic',
  color: '#0b080f', lineHeight: 1.5, margin: 0,
}
const cardActions: React.CSSProperties = { display: 'flex', gap: 8, marginTop: 12 }
const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 999, border: '1px solid #f3cad7',
  background: 'transparent', color: '#c1216b', cursor: 'pointer', fontSize: 13,
}
const primaryBtn: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 999, border: 'none', background: '#e7548a',
  color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
}
const emptyState: React.CSSProperties = { textAlign: 'center', padding: '40px 20px' }
const emptyMsg: React.CSSProperties = { color: '#7a4458', textAlign: 'center', padding: 20 }
const subSection: React.CSSProperties = {
  maxWidth: 720, margin: '36px auto 0', padding: '20px', background: '#fff', borderRadius: 14,
  marginLeft: 20, marginRight: 20,
}
const subHeader: React.CSSProperties = { margin: 0, fontSize: 18, color: '#c1216b' }
const subBody: React.CSSProperties = { color: '#7a4458', fontSize: 14, marginTop: 6 }
const subRow: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 12 }
