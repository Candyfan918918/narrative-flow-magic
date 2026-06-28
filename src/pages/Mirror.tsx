/* Reactive Mirror — adds Shape of You (§14) + Behavioral card (§13) + speak
 * channel entry on top of the existing portrait. */
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useServerFn } from '@tanstack/react-start'
import { getMirrorPortrait, type MirrorPortrait } from '@/lib/mirror.functions'
import { mirrorShape, type ShapeReading } from '@/lib/agents/mirror-shape.functions'
import { getBehavioralProfile, type BehavioralProfile } from '@/lib/behavioral.functions'
import { Header } from '@/components/Header'
import { MirrorSpeakSheet } from '@/components/mirror/MirrorSpeak'
import { track } from '@/lib/behavioral'

const ACCENT = '#7F77DD'
const PINK = '#c1216b'

function ArcChart({ series }: { series: MirrorPortrait['score_series'] }) {
  if (series.length < 2) return null
  const w = 560, h = 160, pad = 16
  const step = (w - pad * 2) / Math.max(1, series.length - 1)
  const pts = series.map((p, i) => [pad + i * step, pad + (1 - p.score / 999) * (h - pad * 2)] as const)
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      <defs><linearGradient id="mg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={ACCENT} stopOpacity=".5" /><stop offset="100%" stopColor={ACCENT} stopOpacity="0" /></linearGradient></defs>
      <path d={`${d} L ${pts[pts.length - 1][0]} ${h - pad} L ${pts[0][0]} ${h - pad} Z`} fill="url(#mg)" />
      <path d={d} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={ACCENT} />)}
    </svg>
  )
}

export function MirrorPage() {
  const navigate = useNavigate()
  const fetchPortrait = useServerFn(getMirrorPortrait)
  const fetchShape = useServerFn(mirrorShape)
  const fetchBehavior = useServerFn(getBehavioralProfile)

  const { data: portrait, isLoading } = useQuery({ queryKey: ['mirror', 'me'], queryFn: () => fetchPortrait() })
  const { data: behavior } = useQuery({ queryKey: ['mirror', 'behavior'], queryFn: () => fetchBehavior(), refetchInterval: 3500 })

  const [shape, setShape] = useState<{ reading: ShapeReading; fallback: ShapeReading; previous: ShapeReading | null } | null>(null)
  const [speakOpen, setSpeakOpen] = useState(false)

  useEffect(() => { track('mirror_open') }, [])

  useEffect(() => {
    if (!portrait) return
    const days = portrait.first_seen_at ? Math.max(0, Math.round((Date.now() - new Date(portrait.first_seen_at).getTime()) / 86400000)) : 0
    const sinceLast = portrait.last_seen_at ? Math.round((Date.now() - new Date(portrait.last_seen_at).getTime()) / 86400000) : 0
    const latest = portrait.score_series[portrait.score_series.length - 1]?.score ?? null
    fetchShape({
      data: {
        entries: portrait.total_entries,
        spills: portrait.spill_count,
        scans: portrait.scan_count,
        days_active: days,
        days_since: sinceLast,
        top_pillar: portrait.top_pillar,
        latest_score: latest,
        trend: portrait.trend,
        outcomes: portrait.checkin_trajectory,
        behavioral: behavior ? {
          visits: behavior.visits, top_action: behavior.top_action,
          sentiment: behavior.sentiment, dwell: behavior.dwell,
          last_question: behavior.last_question, events_total: behavior.events_total,
        } : undefined,
      },
    }).then(setShape).catch(() => {})
  }, [portrait, behavior, fetchShape])

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header />
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '36px 22px 80px' }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 11, letterSpacing: '.18em', color: ACCENT }}>THE MIRROR ✦</div>

        {/* Shape of you */}
        <section style={{ marginTop: 12, padding: '20px 0' }}>
          {shape ? (
            <>
              <h1 style={shapeText}>{shape.reading.shape}</h1>
              <p style={shapeLine}>{shape.reading.line}</p>
              {shape.reading.movement && <p style={moveLine}>↗ {shape.reading.movement}</p>}
            </>
          ) : (
            <h1 style={shapeText}>drawing your shape…</h1>
          )}
        </section>

        {isLoading && <p style={italic}>gathering your memory…</p>}

        {portrait?.forming && (
          <section style={card}>
            <p style={italic}>still forming. spill once or twice and i'll start to see you clearly.</p>
            <button onClick={() => navigate('/')} style={primary}>spill or scan →</button>
          </section>
        )}

        {portrait && !portrait.forming && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 18 }}>
              <Stat label="spills" v={String(portrait.spill_count)} />
              <Stat label="scans" v={String(portrait.scan_count)} />
              <Stat label="trend" v={portrait.trend} />
              <Stat label="pillar" v={portrait.top_pillar ?? '—'} />
            </div>

            {portrait.score_series.length >= 2 && (
              <section style={{ ...card, marginTop: 20 }}>
                <div style={sectionLabel}>YOUR ARC</div>
                <ArcChart series={portrait.score_series} />
              </section>
            )}

            {/* Behavioral card (§13) */}
            <section style={{ ...card, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={sectionLabel}>HOW YOU MOVE THROUGH THIS</div>
                <span style={{ fontSize: 10, color: ACCENT }}>● live</span>
              </div>
              {(!behavior || behavior.events_total < 4) ? (
                <p style={italic}>i'm still learning your rhythm — the more you move through shutap, the clearer this gets.</p>
              ) : (
                <>
                  <p style={italic}>what you reach for most here is <strong style={{ color: ACCENT }}>{behavior.top_action_label || '—'}</strong>.</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <Chip>{behavior.visits} visits</Chip>
                    <Chip>{behavior.sentiment}% open to being moved</Chip>
                    <Chip>{behavior.dwell} stories you stayed with</Chip>
                  </div>
                  {behavior.last_question && (
                    <p style={{ ...italic, marginTop: 10, color: '#7a3a5a' }}>last thing you asked me: "{behavior.last_question}"</p>
                  )}
                </>
              )}
            </section>

            {portrait.recent_themes.length > 0 && (
              <section style={{ marginTop: 20 }}>
                <div style={sectionLabel}>WHAT KEEPS COMING UP</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {portrait.recent_themes.map(t => <Chip key={t}>{t}</Chip>)}
                </div>
              </section>
            )}

            <button onClick={() => setSpeakOpen(true)} style={{ ...primary, marginTop: 22, background: ACCENT, width: '100%' }}>sit with the mirror →</button>
            <button onClick={() => navigate('/subscribe')} style={{ ...primary, marginTop: 10, background: 'transparent', color: ACCENT, border: `.5px solid ${ACCENT}55`, width: '100%' }}>open the full mirror</button>
          </>
        )}

        <MirrorSpeakSheet open={speakOpen} onClose={() => setSpeakOpen(false)} portrait={portrait} />
      </main>
    </div>
  )
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div style={{ background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 14, padding: '14px 12px' }}>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '.14em', color: '#9e7a8c', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 22, color: '#0b080f', marginTop: 4 }}>{v}</div>
    </div>
  )
}
function Chip({ children }: { children: React.ReactNode }) {
  return <span style={{ background: '#fff', border: `.5px solid ${ACCENT}33`, color: ACCENT, borderRadius: 999, padding: '6px 12px', fontFamily: 'Sora,sans-serif', fontSize: 12 }}>{children}</span>
}

const shapeText: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 34, lineHeight: 1.18, color: '#0b080f', margin: 0 }
const shapeLine: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 18, color: '#4a3040', marginTop: 4 }
const moveLine: React.CSSProperties = { fontFamily: 'Sora,sans-serif', fontSize: 12, color: ACCENT, marginTop: 8, letterSpacing: '.04em' }
const card: React.CSSProperties = { background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 18, padding: 18 }
const italic: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#4a3040', margin: 0 }
const sectionLabel: React.CSSProperties = { fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '.14em', color: ACCENT, marginBottom: 8 }
const primary: React.CSSProperties = { background: PINK, color: '#fff', border: 0, borderRadius: 999, padding: '12px 18px', fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer' }
