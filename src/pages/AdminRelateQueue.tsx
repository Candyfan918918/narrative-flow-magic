/* Phase 2d — Human-relate SLA ops queue.
 * Admin-only view of un-responded public spills, oldest first, so the
 * launch-era welcoming committee can hit the 30-min first-reaction target. */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { listRelateQueue, relateQueueStats, type RelateQueueRow } from '@/lib/relate-queue.functions'
import { backfillEmbeddings } from '@/lib/embeddings-backfill.functions'
import { schedulerHealth, type SchedulerHealth } from '@/lib/scheduler-health.functions'



const PILLARS = ['all', 'relationships', 'marriage', 'family', 'career'] as const
type PillarFilter = (typeof PILLARS)[number]

export function AdminRelateQueuePage() {
  const list = useServerFn(listRelateQueue)
  const stats = useServerFn(relateQueueStats)
  const [rows, setRows] = useState<RelateQueueRow[]>([])
  const [sla, setSla] = useState(30)
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof relateQueueStats>> | null>(null)
  const [pillar, setPillar] = useState<PillarFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false
    setLoading(true)
    Promise.all([
      list({ data: pillar === 'all' ? { limit: 50 } : { pillar, limit: 50 } }),
      stats(),
    ])
      .then(([q, s]) => {
        if (cancel) return
        setRows(q.rows); setSla(q.sla_minutes); setSummary(s); setError(null)
      })
      .catch((e) => !cancel && setError(e instanceof Error ? e.message : 'failed'))
      .finally(() => !cancel && setLoading(false))
    return () => { cancel = true }
  }, [pillar, list, stats])

  const past = useMemo(() => rows.filter((r) => r.past_sla).length, [rows])

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', color: '#0b080f' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 22px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9e7a8c' }}>admin · launch ops</div>
            <h1 style={{ fontSize: 28, margin: '4px 0 0', letterSpacing: -0.5 }}>relate queue</h1>
            <p style={{ margin: '6px 0 0', color: '#6b4a5c', fontSize: 14, maxWidth: 620 }}>
              every public spill without a human reaction yet. oldest first. target: a real response within {sla} minutes — no astroturf, no fake "me too".
            </p>
          </div>
          <nav style={{ display: 'flex', gap: 10, fontSize: 13, alignItems: 'center' }}>
            <Link to="/admin" style={navStyle}>admin</Link>
            <Link to="/admin/feedback" style={navStyle}>feedback</Link>
            <BackfillButton />
          </nav>
        </div>


        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 22 }}>
            <Stat label="7-day SLA hit-rate" value={`${summary.sla_pct}%`} sub={`${summary.within_sla} / ${summary.total_public_spills} spills`} />
            <Stat label="median first-response" value={summary.median_minutes_to_first_response != null ? `${summary.median_minutes_to_first_response} min` : '—'} sub="last 7 days" />
            <Stat label="open in queue" value={String(rows.length)} sub={`${past} past SLA`} accent={past > 0 ? '#c1216b' : undefined} />
          </div>
        )}

        <SchedulerHealthCard />


        <div style={{ display: 'flex', gap: 8, margin: '22px 0 12px', flexWrap: 'wrap' }}>
          {PILLARS.map((p) => (
            <button key={p} onClick={() => setPillar(p)} style={chipStyle(p === pillar)}>
              {p}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: '#6b4a5c', fontSize: 14 }}>loading…</div>}
        {error && <div style={{ color: '#c1216b', fontSize: 14 }}>error: {error}</div>}
        {!loading && !error && rows.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, color: '#6b4a5c', textAlign: 'center', border: '1px solid rgba(11,8,15,.08)' }}>
            no spills waiting. SLA is being met. 💚
          </div>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {rows.map((r) => <QueueCard key={r.situation_id} row={r} />)}
        </ul>
      </div>
    </div>
  )
}

function QueueCard({ row }: { row: RelateQueueRow }) {
  return (
    <li style={{ background: '#fff', border: `1px solid ${row.past_sla ? 'rgba(193,33,107,.35)' : 'rgba(11,8,15,.08)'}`, borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 22 }}>{row.emoji}</span>
        <strong style={{ fontSize: 14 }}>{row.alias}</strong>
        <Badge color="#7f77dd">{row.pillar}</Badge>
        <Badge color={row.support === 'advice' ? '#c87c4a' : '#5b8a5e'}>{row.support === 'advice' ? 'wants advice' : 'wants to be heard'}</Badge>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: row.past_sla ? '#c1216b' : '#9e7a8c', fontWeight: row.past_sla ? 600 : 400 }}>
          {row.past_sla ? `⚠ ${row.minutes_open} min · past SLA` : `${row.minutes_open} min ago`}
        </span>
      </div>
      {row.title && <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{row.title}</div>}
      <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.55, color: '#3a2a32' }}>{row.body}</p>
      <Link
        to={`/room?id=${row.situation_id}`}
        style={{ display: 'inline-block', background: '#0b080f', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600 }}
      >open & respond →</Link>
    </li>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(11,8,15,.08)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#9e7a8c' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: accent ?? '#0b080f', marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b4a5c', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ background: color + '22', color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, textTransform: 'lowercase', letterSpacing: 0.3 }}>{children}</span>
  )
}

function BackfillButton() {
  const run = useServerFn(backfillEmbeddings)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <button
      onClick={async () => {
        setBusy(true); setMsg(null)
        try {
          const r = await run({ data: { limit: 50 } })
          setMsg(`+${r.embedded}/${r.scanned} · ${r.remaining} left`)
        } catch (e) {
          setMsg(e instanceof Error ? e.message : 'failed')
        } finally { setBusy(false) }
      }}
      disabled={busy}
      style={{ ...navStyle, cursor: 'pointer', fontWeight: 600, color: '#c1216b' }}
      title="Backfill embeddings for situations missing a vector"
    >
      {busy ? 'embedding…' : msg ? `embed · ${msg}` : 'embed batch'}
    </button>
  )
}


const navStyle: React.CSSProperties = {
  color: '#6b4a5c', textDecoration: 'none', padding: '6px 12px', borderRadius: 999,
  border: '1px solid rgba(11,8,15,.12)', background: '#fff',
}

const chipStyle = (active: boolean): React.CSSProperties => ({
  background: active ? '#0b080f' : '#fff',
  color: active ? '#fff' : '#6b4a5c',
  border: `1px solid ${active ? '#0b080f' : 'rgba(11,8,15,.12)'}`,
  borderRadius: 999, padding: '6px 14px', fontSize: 13, cursor: 'pointer', textTransform: 'lowercase',
})
