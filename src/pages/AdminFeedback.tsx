/* Admin → Feedback dashboard. Reads aggregated summary only, never raw rows. */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFeedbackSummary, type FeedbackSummary } from '../lib/feedback-summary.functions'

const labels: Record<string, string> = {
  spill_abandon: 'spill — left mid-interview',
  scan_abandon: 'scan — closed before reveal',
  share_dismiss: 'share offer dismissed',
  room_bounce: 'room — bounced <4s',
  dead_click: 'dead click',
  rage_click: 'frustration taps',
  paywall_bounce: 'paywall — bounced',
  paywall_view: 'paywall — shown',
  rate_friction: 'rated 🥀 not for me',
  error: 'error',
  scan_done: 'scan completed',
  spill_publish: 'spill published',
  mirror_open: 'mirror opened',
  mirror_reading: 'mirror — reading opened',
  mirror_unlock: 'mirror — unlocked',
  relate: 'pressed “relate”',
  react: 'reaction tapped',
  comment_post: 'comment posted',
  share_accept: 'share — accepted',
  room_dwell_long: 'room — long dwell',
  return_visit: 'came back',
  rate_loved: 'rated 🤍 this helped',
  companion_q: 'asked the companion',
  search: 'searched the stream',
  page_view: 'page view',
  room_open: 'opened a room',
  companion_open: 'opened the companion',
  rate_meh: 'rated meh',
}

function pretty(k: string): string {
  if (k.startsWith('room:')) return `room · ${k.slice(5).slice(0, 8)}`
  return labels[k] ?? k.replace(/_/g, ' ')
}

function buildQueue(s: FeedbackSummary): string[] {
  const byType = new Map(s.byType.map((b) => [b.key, b.n]))
  const out: string[] = []
  if ((byType.get('spill_abandon') ?? 0) >= 2) out.push("spill interview drop-off — fewer questions / clearer 'almost done'.")
  if ((byType.get('room_bounce') ?? 0) >= 2) out.push('rooms bounced <4s — strengthen the first screen.')
  if ((byType.get('share_dismiss') ?? 0) >= 2) out.push('share offers dismissed — lower frequency / improve card.')
  if ((byType.get('paywall_view') ?? 0) >= 2 && (byType.get('mirror_unlock') ?? 0) === 0) {
    out.push('mirror paywall not converting — show one more reading free / clearer trial.')
  }
  if ((byType.get('rage_click') ?? 0) >= 1) out.push('frustration taps — something looks tappable but isn\'t; audit it.')
  if (!out.length) out.push('no urgent friction — watch the questions feed for what to build next.')
  return out
}

export function AdminFeedbackPage() {
  const [windowDays, setWindowDays] = useState(7)
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)
    getFeedbackSummary({ data: { windowDays } })
      .then((s) => { if (!cancelled) setSummary(s) })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : 'failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [windowDays])

  const queue = useMemo(() => (summary ? buildQueue(summary) : []), [summary])
  const max = (xs: { n: number }[]) => Math.max(1, ...xs.map((x) => x.n))

  return (
    <div style={{
      minHeight: '100vh', background: '#faf9f5', padding: '24px 18px 80px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#2e0a1a',
    }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Link to="/admin" style={{ color: '#c1216b', textDecoration: 'none', fontWeight: 600 }}>← admin</Link>
          <h1 style={{ fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic', fontWeight: 500, fontSize: 28, margin: 0 }}>
            🫶 feedback
          </h1>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {[1, 7, 30].map((d) => (
              <button key={d} onClick={() => setWindowDays(d)} style={{
                borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 600,
                border: '1px solid ' + (windowDays === d ? '#c1216b' : 'rgba(193,33,107,.2)'),
                background: windowDays === d ? '#c1216b' : '#fff',
                color: windowDays === d ? '#fff' : '#c1216b', cursor: 'pointer',
              }}>{d === 1 ? '24h' : `${d}d`}</button>
            ))}
          </div>
        </div>

        <Card>
          <div style={{ fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic', fontSize: 15, color: '#6b3a4f' }}>
            signal, not surveillance — captured on-device from behaviour + questions, pseudonymous, text feedback opt-in.
          </div>
        </Card>

        {err && <Card><div style={{ color: '#a23' }}>{err}</div></Card>}
        {loading && !summary && <Card><div style={{ color: '#9a6a7a' }}>listening…</div></Card>}

        {summary && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) 2fr', gap: 14, marginTop: 14 }}>
              <Card>
                <Ring pct={summary.sentiment} />
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#9a6a7a' }}>love-share</div>
              </Card>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <Kpi label="🤍 love" n={summary.counts.love} accent="#c1216b" />
                <Kpi label="⚠ friction" n={summary.counts.friction} accent="#b8753a" />
                <Kpi label="🗣 questions" n={summary.counts.question} accent="#5b8a5e" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
              <Card>
                <H2>💚 what people love</H2>
                <BarList items={summary.loved} max={max(summary.loved)} color="#5b8a5e" />
              </Card>
              <Card>
                <H2>⚠ where they struggle</H2>
                <BarList items={summary.friction} max={max(summary.friction)} color="#b8753a" />
              </Card>
            </div>

            <Card>
              <H2>🗣 what they're asking the companion</H2>
              {summary.questions.length === 0 ? (
                <div style={{ color: '#9a6a7a', fontSize: 13 }}>quiet so far.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {summary.questions.map((q, i) => (
                    <div key={i} style={{ borderLeft: '2px solid rgba(193,33,107,.3)', paddingLeft: 12 }}>
                      <div style={{ fontFamily: '"Newsreader", Georgia, serif', fontStyle: 'italic', fontSize: 15 }}>
                        "{q.text}"
                      </div>
                      <div style={{ fontSize: 11, color: '#9a6a7a', marginTop: 3 }}>
                        {q.page ?? '—'} · {new Date(q.t).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <H2>🚢 today's build queue</H2>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {queue.map((q, i) => (
                  <li key={i} style={{ fontSize: 14, lineHeight: 1.5 }}>{q}</li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(193,33,107,.12)',
      borderRadius: 16, padding: 16, marginTop: 14,
      boxShadow: '0 1px 2px rgba(46,10,26,.04)',
    }}>{children}</div>
  )
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', margin: '0 0 12px', color: '#6b3a4f' }}>{children}</h2>
}
function Kpi({ label, n, accent }: { label: string; n: number; accent: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(193,33,107,.12)',
      borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    }}>
      <div style={{ fontSize: 12, color: '#9a6a7a' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: accent, marginTop: 4 }}>{n}</div>
    </div>
  )
}
function Ring({ pct }: { pct: number }) {
  const r = 44, c = 2 * Math.PI * r
  const off = c - (pct / 100) * c
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} stroke="rgba(193,33,107,.12)" strokeWidth="10" fill="none" />
        <circle cx="60" cy="60" r={r} stroke="#c1216b" strokeWidth="10" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 60 60)" />
        <text x="60" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill="#c1216b">{pct}%</text>
      </svg>
    </div>
  )
}
function BarList({ items, max, color }: { items: { key: string; n: number }[]; max: number; color: string }) {
  if (!items.length) return <div style={{ color: '#9a6a7a', fontSize: 13 }}>nothing yet.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it) => (
        <div key={it.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b3a4f', marginBottom: 3 }}>
            <span>{pretty(it.key)}</span><span style={{ fontWeight: 600 }}>{it.n}</span>
          </div>
          <div style={{ height: 8, background: 'rgba(193,33,107,.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${(it.n / max) * 100}%`, height: '100%', background: color, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
