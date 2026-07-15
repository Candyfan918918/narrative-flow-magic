// Admin console — response floor & liquidity.
// Access is gated by has_role('admin') on the server. On the client we still
// call the admin server fns; unauthorized users see an empty/permission
// state (server throws Forbidden). The route also emits robots:noindex.
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  adminNewRooms,
  adminNeedsResponse,
  adminLiquidityStats,
} from '@/lib/admin.functions'

const BG = '#0f0916'
const CARD: React.CSSProperties = {
  background: '#181020',
  border: '.5px solid rgba(255,255,255,.08)',
  borderRadius: 14,
  padding: '18px 20px',
  color: '#e8dfea',
}
const CHIP: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgba(231,84,138,.16)',
  color: '#f7b8d4',
  fontSize: 11,
  fontFamily: 'Sora, sans-serif',
  fontWeight: 600,
  letterSpacing: '.04em',
}

type RoomListItem = {
  room_id: string
  situation_id: string
  title: string
  clean_text: string
  pillar: string | null
  initial_scan: number | null
  scan_band: string | null
  created_at: string
  age_hours: number
  human_relates: number
  human_comments: number
  companion_comments: number
}

function fmtAge(hours: number): string {
  if (hours < 1) return '<1h'
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function RoomRow({ r }: { r: RoomListItem }) {
  return (
    <a
      href={`/room?id=${encodeURIComponent(r.room_id)}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 90px 60px 60px 60px',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '.5px solid rgba(255,255,255,.06)',
        textDecoration: 'none',
        color: '#e8dfea',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13.5, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
        <div style={{ fontSize: 11.5, color: '#9a8fa2' }}>
          {r.pillar || '—'} · {fmtAge(r.age_hours)} ago
        </div>
      </div>
      <span style={{ fontVariantNumeric: 'tabular-nums', color: '#f7b8d4', textAlign: 'right', fontSize: 13 }}>
        {r.initial_scan ?? '—'}{r.scan_band ? ` · ${r.scan_band}` : ''}
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontSize: 13 }}>{r.human_relates}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontSize: 13 }}>{r.human_comments}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontSize: 13, color: '#9a8fa2' }}>{r.companion_comments}</span>
    </a>
  )
}

function RoomTable({ title, rows, empty }: { title: string; rows: RoomListItem[] | undefined; empty: string }) {
  return (
    <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '.5px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <b style={{ fontFamily: 'Sora,sans-serif', fontSize: 14 }}>{title}</b>
        <span style={{ fontSize: 11.5, color: '#9a8fa2' }}>{rows?.length ?? 0} rooms</span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 90px 60px 60px 60px',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '.5px solid rgba(255,255,255,.06)',
        fontSize: 10.5,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        color: '#9a8fa2',
        fontFamily: 'Sora,sans-serif',
        fontWeight: 700,
      }}>
        <span>room</span>
        <span style={{ textAlign: 'right' }}>scan</span>
        <span style={{ textAlign: 'right' }}>relates</span>
        <span style={{ textAlign: 'right' }}>replies</span>
        <span style={{ textAlign: 'right' }}>ai</span>
      </div>
      {(!rows || rows.length === 0) ? (
        <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9a8fa2', fontFamily: 'Newsreader,serif', fontStyle: 'italic' }}>{empty}</div>
      ) : rows.map((r) => <RoomRow key={r.room_id} r={r} />)}
    </div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={CARD}>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 28, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#9a8fa2', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#6fcf97', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export function AdminPage() {
  const [tab, setTab] = useState<'needs' | 'new'>('needs')

  const fetchStats = useServerFn(adminLiquidityStats)
  const fetchNeeds = useServerFn(adminNeedsResponse)
  const fetchNew = useServerFn(adminNewRooms)

  const statsQ = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => fetchStats({ data: {} }) })
  const needsQ = useQuery({ queryKey: ['admin', 'needs'], queryFn: () => fetchNeeds({ data: {} }), enabled: tab === 'needs' })
  const newQ = useQuery({ queryKey: ['admin', 'new'], queryFn: () => fetchNew({ data: {} }), enabled: tab === 'new' })

  const forbidden = statsQ.error && /forbidden/i.test(String((statsQ.error as Error).message))

  if (forbidden) {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#e8dfea', display: 'grid', placeItems: 'center', padding: 40 }}>
        <div style={{ ...CARD, maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>admin only</div>
          <div style={{ color: '#9a8fa2', fontSize: 13, marginBottom: 14 }}>this console is gated. sign in as an admin.</div>
          <Link to="/" style={{ color: '#f7b8d4' }}>← home</Link>
        </div>
      </div>
    )
  }

  const s = statsQ.data
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#e8dfea', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 26, margin: 0, letterSpacing: '-.02em' }}>admin</h1>
          <span style={CHIP}>response floor</span>
        </div>
        <p style={{ color: '#9a8fa2', fontSize: 13, marginTop: 0, marginBottom: 22 }}>real data. every public room deserves a human within the SLA.</p>

        {/* Liquidity stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
          <Kpi label="public rooms" value={String(s?.total_public_rooms ?? '—')} />
          <Kpi label="response coverage" value={s ? `${s.response_coverage_pct}%` : '—'} />
          <Kpi label="24h coverage" value={s ? `${s.coverage_24h_pct}%` : '—'} sub={s ? `${s.new_rooms_24h} new` : undefined} />
          <Kpi label="cold rooms (>72h)" value={String(s?.cold_rooms_over_72h ?? '—')} />
          <Kpi label="median TTFR" value={s?.median_ttfr_hours != null ? `${s.median_ttfr_hours}h` : '—'} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['needs', 'new'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 0,
                background: tab === t ? '#e7548a' : 'rgba(255,255,255,.06)',
                color: tab === t ? '#fff' : '#c9bcd0',
                fontFamily: 'Sora,sans-serif',
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {t === 'needs' ? 'needs response' : 'new rooms'}
            </button>
          ))}
        </div>

        {tab === 'needs' && (
          <RoomTable
            title="rooms waiting on a human"
            rows={needsQ.data as RoomListItem[] | undefined}
            empty={needsQ.isLoading ? 'loading…' : 'nothing waiting — every room has a human. 🩷'}
          />
        )}
        {tab === 'new' && (
          <RoomTable
            title="latest public rooms"
            rows={newQ.data as RoomListItem[] | undefined}
            empty={newQ.isLoading ? 'loading…' : 'no public rooms yet.'}
          />
        )}

        <div style={{ marginTop: 24, fontSize: 12, color: '#6e6675', textAlign: 'center' }}>
          <Link to="/admin/feedback" style={{ color: '#9a8fa2', marginRight: 14 }}>feedback →</Link>
          <Link to="/admin_/relate-queue" style={{ color: '#9a8fa2' }}>relate SLA →</Link>
        </div>
      </div>
    </div>
  )
}
