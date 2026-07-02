/* Real React Profile page. Lists the user's own situations plus lets them
 * edit their pseudonymous alias (one row per user in public.aliases). */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { Header } from '../components/Header'
import { useToast } from '../components/Toast'
import {
  listMySituations,
  updateSituation,
  deleteSituation,
} from '../lib/situations.functions'
import { getMyAlias, upsertMyAlias, rerollMyAlias } from '@/lib/alias.functions'
import { signOut as unifiedSignOut } from '@/lib/auth'
import { supabase } from '@/integrations/supabase/client'
import { useNoIndex } from '@/components/NoIndex'

type Tab = 'all' | 'rooms' | 'journals' | 'scans'

const BAND_COLOR: Record<string, string> = {
  settling: '#5B8A5E',
  sitting: '#7F77DD',
  weighing: '#c1a02b',
  heavy: '#c87c4a',
  consuming: '#c1216b',
  quiet: '#5B8A5E',
  real: '#7F77DD',
  hot: '#c87c4a',
  serious: '#c1216b',
}

interface Situation {
  id: string
  pillar: string | null
  clean_text: string | null
  title: string | null
  body: string | null
  kind: 'scan' | 'spill' | null
  initial_scan: number | null
  scan_band: string | null
  tags: string[] | null
  is_public: boolean
  room_id: string | null
  status: string
  edited: boolean
  created_at: string
  updated_at: string
}

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm'
  if (s < 86400) return Math.floor(s / 3600) + 'h'
  return Math.floor(s / 86400) + 'd'
}

export function ProfilePage() {
  useNoIndex()
  const navigate = useNavigate()
  const { toast, ToastHost } = useToast()
  const list = useServerFn(listMySituations)
  const update = useServerFn(updateSituation)
  const remove = useServerFn(deleteSituation)
  const readAlias = useServerFn(getMyAlias)
  const saveAlias = useServerFn(upsertMyAlias)
  const rerollAlias = useServerFn(rerollMyAlias)
  const [rows, setRows] = useState<Situation[] | null>(null)
  const [email, setEmail] = useState<string>('')
  const [tab, setTab] = useState<Tab>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [alias, setAlias] = useState<{ emotion: string; nation: string; creature: string; emoji: string; display_name: string } | null>(null)
  const [editAlias, setEditAlias] = useState(false)
  const [aliasBusy, setAliasBusy] = useState(false)

  async function refresh() {
    try {
      const data = (await list()) as Situation[]
      setRows(data)
    } catch {
      toast('couldn\'t load your stories.')
      setRows([])
    }
  }

  async function refreshAlias() {
    try {
      const a = await readAlias()
      if (a) {
        const row = a as { emotion: string; nation: string; creature: string; emoji: string; display_name: string }
        setAlias(row)
        try { localStorage.setItem('shutap_alias', JSON.stringify({ name: row.display_name, emoji: row.emoji })) } catch {}
      }
    } catch { /* not signed in */ }
  }

  useEffect(() => {
    refresh()
    refreshAlias()
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    if (!rows) return { rooms: 0, journals: 0, scans: 0 }
    return {
      rooms: rows.filter((r) => r.is_public && r.kind !== 'scan').length,
      journals: rows.filter((r) => !r.is_public).length,
      scans: rows.filter((r) => r.kind === 'scan').length,
    }
  }, [rows])

  const filtered = useMemo(() => {
    if (!rows) return []
    if (tab === 'all') return rows
    if (tab === 'rooms') return rows.filter((r) => r.is_public && r.kind !== 'scan')
    if (tab === 'journals') return rows.filter((r) => !r.is_public)
    return rows.filter((r) => r.kind === 'scan')
  }, [rows, tab])

  async function togglePrivacy(s: Situation) {
    setBusy(s.id)
    try {
      const next = !s.is_public
      await update({ data: { id: s.id, is_public: next } })
      toast(next ? 'posted to the stream.' : 'moved to private journal.')
      await refresh()
    } catch {
      toast('couldn\'t update.')
    } finally {
      setBusy(null)
    }
  }

  async function onDelete(s: Situation) {
    if (!window.confirm('delete this for good?')) return
    setBusy(s.id)
    try {
      await remove({ data: { id: s.id } })
      toast('deleted.')
      await refresh()
    } catch {
      toast('couldn\'t delete.')
    } finally {
      setBusy(null)
    }
  }

  async function signOut() {
    await unifiedSignOut()
    navigate('/welcome')
  }

  function cacheAlias(row: { emoji: string; display_name: string }) {
    try { localStorage.setItem('shutap_alias', JSON.stringify({ name: row.display_name, emoji: row.emoji })) } catch {}
    // Also rewrite the user's own historic room tiles so the feed reflects
    // the current alias (item 6: no stale denormalized display).
    try {
      const raw = localStorage.getItem('shutap_user_situations')
      if (raw) {
        const arr = JSON.parse(raw) as Array<{ alias?: string; emoji?: string }>
        for (const r of arr) { r.alias = row.display_name; r.emoji = row.emoji }
        localStorage.setItem('shutap_user_situations', JSON.stringify(arr))
      }
    } catch { /* noop */ }
    window.dispatchEvent(new Event('shutap:alias-changed'))
  }

  async function onReroll() {
    setAliasBusy(true)
    try {
      const a = await rerollAlias()
      if (a) {
        const row = a as { emotion: string; nation: string; creature: string; emoji: string; display_name: string }
        setAlias(row)
        cacheAlias(row)
        toast('new alias.')
      }
    } catch { toast('couldn\'t re-roll.') }
    finally { setAliasBusy(false) }
  }

  async function onSaveAlias(patch: Partial<{ emotion: string; nation: string; creature: string; emoji: string }>) {
    setAliasBusy(true)
    try {
      const a = await saveAlias({ data: patch })
      if (a) {
        const row = a as { emotion: string; nation: string; creature: string; emoji: string; display_name: string }
        setAlias(row)
        cacheAlias(row)
        toast('alias saved.')
        setEditAlias(false)
      }
    } catch { toast('couldn\'t save.') }
    finally { setAliasBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header onToast={toast} />

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '26px 22px 90px' }}>
        {/* eyebrow */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9e7a8c', marginBottom: 6 }}>
            your profile
          </div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 'clamp(22px,4vw,30px)', margin: 0, color: '#0b080f', letterSpacing: '-.02em' }}>
            your stories
          </h1>
          <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14.5, color: '#6b4a5c', margin: '6px 0 0' }}>
            {email ? <>signed in as <strong style={{ color: '#0b080f' }}>{email}</strong> · </> : null}
            edit, make private, or delete anything here.
          </p>
        </div>

        {/* alias card */}
        {alias && (
          <div style={{ background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 16, padding: '16px 18px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: '#f7e8f0', display: 'grid', placeItems: 'center', fontSize: 22 }}>{alias.emoji}</span>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c' }}>your alias</div>
                <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 18, color: '#0b080f' }}>{alias.display_name}</div>
              </div>
              <button
                disabled={aliasBusy}
                onClick={() => setEditAlias((v) => !v)}
                style={btn('#c1216b')}
              >{editAlias ? 'close' : 'edit alias'}</button>
              <button
                disabled={aliasBusy}
                onClick={onReroll}
                style={btn('#7F77DD')}
              >re-roll</button>
            </div>
            {editAlias && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {(['emotion', 'nation', 'creature'] as const).map((k) => (
                  <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c' }}>{k}</span>
                    <input
                      defaultValue={alias[k]}
                      onBlur={(e) => {
                        const v = e.target.value.trim()
                        if (v && v !== alias[k]) onSaveAlias({ [k]: v })
                      }}
                      style={{ border: '.5px solid rgba(11,8,15,.15)', borderRadius: 10, padding: '8px 10px', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, background: '#fff' }}
                    />
                  </label>
                ))}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c' }}>emoji</span>
                  <input
                    defaultValue={alias.emoji}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v && v !== alias.emoji) onSaveAlias({ emoji: v })
                    }}
                    maxLength={4}
                    style={{ border: '.5px solid rgba(11,8,15,.15)', borderRadius: 10, padding: '8px 10px', fontFamily: 'Inter,sans-serif', fontSize: 16, background: '#fff' }}
                  />
                </label>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          {[
            { k: 'rooms' as const, n: counts.rooms, label: 'rooms open' },
            { k: 'journals' as const, n: counts.journals, label: 'private journals' },
            { k: 'scans' as const, n: counts.scans, label: 'scans' },
          ].map((s) => (
            <div key={s.k} style={{ background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 14, padding: '12px 18px', minWidth: 120 }}>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 22, color: '#0b080f', letterSpacing: '-.02em' }}>{s.n}</div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* tab pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {(['all', 'rooms', 'journals', 'scans'] as Tab[]).map((f) => {
            const active = tab === f
            return (
              <button
                key={f}
                onClick={() => setTab(f)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: '.5px solid ' + (active ? '#e7548a' : 'rgba(11,8,15,.12)'),
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#c1216b' : '#6b4a5c',
                  fontFamily: 'Sora,sans-serif',
                  fontWeight: 600,
                  fontSize: 11.5,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {f === 'all' ? 'all' : f === 'rooms' ? 'rooms' : f === 'journals' ? 'journals' : 'scans ✦'}
              </button>
            )
          })}
        </div>

        {/* list */}
        {rows === null ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#9e7a8c' }}>loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#9e7a8c' }}>
            nothing here yet.{' '}
            <span style={{ color: '#c1216b', cursor: 'pointer' }} onClick={() => navigate('/')}>start a spill →</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filtered.map((s) => {
              const isScan = s.kind === 'scan' && typeof s.initial_scan === 'number'
              const band = (s.scan_band || 'sitting') as keyof typeof BAND_COLOR
              const accent = BAND_COLOR[band] || '#7F77DD'
              return (
                <article key={s.id} style={{ background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 9.5, letterSpacing: '.14em', color: isScan ? accent : (s.is_public ? '#c1216b' : '#6b4a5c'), background: (isScan ? accent : (s.is_public ? '#e7548a' : '#6b4a5c')) + '15', padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase' }}>
                      {isScan ? 'scan' : s.is_public ? 'room' : 'journal'}
                    </span>
                    {s.pillar && (
                      <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6b4a5c', background: '#f7e8f0', padding: '3px 8px', borderRadius: 999 }}>{s.pillar}</span>
                    )}
                    {s.edited && (
                      <span style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 11.5, color: '#9e7a8c' }}>edited</span>
                    )}
                    <span style={{ flex: 1 }} />
                    <span style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 11.5, color: '#9e7a8c' }}>{timeAgo(s.created_at)}</span>
                  </div>

                  {isScan ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 48, lineHeight: 1, letterSpacing: '-.04em', color: accent }}>{s.initial_scan}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: accent }}>{band}</div>
                        <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15.5, lineHeight: 1.35, color: '#2e1a26' }}>{s.title || s.clean_text?.slice(0, 120)}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {s.title && (
                        <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 16, margin: 0, color: '#0b080f' }}>{s.title}</h3>
                      )}
                      <p style={{ fontFamily: 'Newsreader,serif', fontSize: 14.5, lineHeight: 1.5, color: '#2e1a26', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {(s.body || s.clean_text || '').slice(0, 260)}
                        {((s.body || s.clean_text || '').length > 260) ? '…' : ''}
                      </p>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                    {s.is_public && s.room_id && (
                      <button
                        onClick={() => navigate('/room?id=' + s.room_id)}
                        style={btn('#c1216b')}
                      >open room →</button>
                    )}
                    <button
                      disabled={busy === s.id}
                      onClick={() => togglePrivacy(s)}
                      style={btn('#6b4a5c')}
                    >
                      {s.is_public ? 'make private' : 'post to stream'}
                    </button>
                    <button
                      disabled={busy === s.id}
                      onClick={() => onDelete(s)}
                      style={btn('#9e3a3a')}
                    >delete</button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 36, paddingTop: 22, borderTop: '.5px solid rgba(11,8,15,.08)' }}>
          <button onClick={signOut} style={{ ...btn('#6b4a5c'), background: 'transparent' }}>sign out</button>
        </div>
      </main>

      {ToastHost}
    </div>
  )
}

function btn(color: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: '.5px solid ' + color + '40',
    background: color + '10',
    color,
    fontFamily: 'Sora,sans-serif',
    fontWeight: 600,
    fontSize: 11.5,
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  }
}
