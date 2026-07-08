/* Native React port of the former public/shutap/Admin.dc.html iframe.
 * Full-fidelity visual parity: sidebar shell, KPI cards, moderation queue
 * (reads localStorage shutap_modqueue like the original), rooms/members/
 * analytics/feedback/safety/config subviews. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNoIndex } from '@/components/NoIndex'
import { SHUTAP_SEED } from '@/data/seed'
import type { Room } from '@/data/types'

type ViewKey =
  | 'overview' | 'queue' | 'rooms' | 'users'
  | 'analytics' | 'feedback' | 'safety' | 'config'

const NAV: Array<{ k: ViewKey; label: string; icon: string }> = [
  { k: 'overview',  label: 'Overview',   icon: '▦' },
  { k: 'queue',     label: 'Moderation', icon: '🛡' },
  { k: 'rooms',     label: 'Rooms',      icon: '💬' },
  { k: 'users',     label: 'Members',    icon: '👤' },
  { k: 'analytics', label: 'Analytics',  icon: '📈' },
  { k: 'feedback',  label: 'Feedback',   icon: '🫶' },
  { k: 'safety',    label: 'Safety',     icon: '🆘' },
  { k: 'config',    label: 'Config',     icon: '⚙' },
]

const CARD: React.CSSProperties = {
  background: '#181020',
  border: '.5px solid rgba(255,255,255,.08)',
  borderRadius: 16,
  padding: '18px 20px',
}
const CHIP: React.CSSProperties = {
  fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 9.5,
  letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999,
}
const QROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '13px 0', borderBottom: '.5px solid rgba(255,255,255,.06)',
}
const BAR: React.CSSProperties = {
  height: 7, borderRadius: 4, background: 'rgba(255,255,255,.07)', overflow: 'hidden',
}
const BTN_APPROVE: React.CSSProperties = {
  fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 11.5,
  borderRadius: 999, padding: '6px 13px', cursor: 'pointer', border: 'none',
  transition: '.15s', background: '#1d7a52', color: '#dffbe9',
}
const BTN_REJECT: React.CSSProperties = { ...BTN_APPROVE, background: 'rgba(255,255,255,.06)', color: '#d99' }

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h1 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', margin: '0 0 4px' }}>{title}</h1>
      <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14.5, color: '#9a8fa2', marginBottom: 24 }}>{sub}</div>
    </>
  )
}

/* ── Views ─────────────────────────────────────────────────────────── */

function Overview({ onGoto }: { onGoto: (k: ViewKey) => void }) {
  const kpis: Array<[string, string, string]> = [
    ['Rooms open', '1,284', '+8.2% wk'],
    ['People sitting in now', '327', 'live'],
    ['Hearts given today', '9,640', '+12%'],
    ['New members', '214', 'this week'],
  ]
  const spark = (vals: number[], col: string) => {
    const max = Math.max(...vals); const w = 100 / vals.length
    return (
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: 38 }}>
        {vals.map((v, i) => <rect key={i} x={i * w + 1} y={30 - (v / max * 28)} width={w - 2} height={v / max * 28} rx={1} fill={col} />)}
      </svg>
    )
  }
  const reactions: Array<[string, number, string]> = [
    ['🤍 i hear you', 42, '#e7548a'],
    ['🫂 omg same', 31, '#c87c4a'],
    ["💪 you've got this", 14, '#5B8A5E'],
    ['🌿 it gets easier', 8, '#7F77DD'],
    ['✨ so brave', 5, '#c1a02b'],
  ]
  return (
    <>
      <Head title="Overview" sub="how the rooms are doing — today across Shutap." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k[0]} style={CARD}>
            <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.02em', display: 'block', lineHeight: 1.1 }}>{k[1]}</b>
            <span style={{ fontSize: 12, color: '#9a8fa2' }}>{k[0]}</span>
            <div style={{ marginTop: 8, fontSize: 11, color: '#6fcf97' }}>{k[2]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={CARD}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14 }}>Rooms opened · last 14 days</b>
            <span style={{ fontSize: 11.5, color: '#9a8fa2' }}>avg 92/day</span>
          </div>
          {spark([62,71,58,80,74,95,88,103,79,96,110,90,118,124], '#e7548a')}
        </div>
        <div style={CARD}>
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 14 }}>Support reactions</b>
          {reactions.map((r) => (
            <div key={r[0]} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c9bcd0', marginBottom: 4 }}>
                <span>{r[0]}</span><b>{r[1]}%</b>
              </div>
              <div style={BAR}><i style={{ display: 'block', height: '100%', width: `${r[1]}%`, background: r[2], borderRadius: 4 }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14 }}>Needs your attention</b>
          <span onClick={() => onGoto('queue')} style={{ fontSize: 11.5, color: '#f7b8d4', cursor: 'pointer' }}>moderation queue →</span>
        </div>
        {[
          ['#EF9F27', '5 rooms held by the privacy shield (possible identifiers)', 'review'],
          ['#E24B4A', '2 rooms flagged by the safety net (crisis language)', 'urgent'],
          ['#7F77DD', '3 comments reported by members', 'review'],
        ].map((r, i) => (
          <div key={i} style={QROW}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: r[0], flex: 'none', animation: i === 0 ? 'breathe 2.5s infinite' : undefined }} />
            <span style={{ flex: 1, fontSize: 13.5 }}>{r[1]}</span>
            <span style={{ ...CHIP, background: `${r[0]}29`, color: r[0] }}>{r[2]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

type QItem = { kind: string; color: string; label: string; title: string; reason: string; alias: string; emoji: string }
function Queue({ rooms, onAction }: { rooms: Room[]; onAction: () => void }) {
  const seedItems: QItem[] = useMemo(() => [
    { kind: 'shield', color: '#EF9F27', label: 'privacy shield', title: rooms[2]?.title || 'A room with a possible name', reason: 'detected a possible first name + workplace', alias: 'Mortified Polish Hedgehog', emoji: '🦔' },
    { kind: 'safety', color: '#E24B4A', label: 'safety net', title: "I don't see the point in any of this anymore", reason: 'crisis language — routed to resources, awaiting human review', alias: 'Forlorn Welsh Heron', emoji: '🪿' },
    { kind: 'report', color: '#7F77DD', label: 'member report', title: 'comment: "honestly you brought this on yourself"', reason: 'reported 3× — unkind / against room norms', alias: 'Bitter Czech Hawk', emoji: '🦅' },
    { kind: 'shield', color: '#EF9F27', label: 'privacy shield', title: rooms[5]?.title || 'A room mentioning a school', reason: 'detected a school name', alias: 'Tender Brazilian Hare', emoji: '🐇' },
    { kind: 'report', color: '#7F77DD', label: 'member report', title: 'comment: contains an external link', reason: 'reported 1× — possible spam', alias: 'Restless Filipino Fox', emoji: '🦊' },
  ], [rooms])

  const [items, setItems] = useState<QItem[]>([])
  const [handled, setHandled] = useState<Record<number, boolean>>({})

  useEffect(() => {
    let live: Array<{ kind?: string; signal?: string }> = []
    try { live = JSON.parse(localStorage.getItem('shutap_modqueue') || '[]') } catch { /* noop */ }
    const map: Record<string, { color: string; label: string; emoji: string }> = {
      safety: { color: '#E24B4A', label: 'safety net', emoji: '🆘' },
      report: { color: '#7F77DD', label: 'flagged', emoji: '🚩' },
      shield: { color: '#EF9F27', label: 'privacy shield', emoji: '🛡' },
    }
    const liveItems: QItem[] = live.slice().reverse().map((l) => {
      const m = map[l.kind || 'report'] || map.report
      return { kind: l.kind || 'report', color: m.color, label: m.label + ' · live', title: 'a freshly spilled room', reason: l.signal || '', alias: 'just now', emoji: m.emoji }
    })
    setItems([...liveItems, ...seedItems])
  }, [seedItems])

  return (
    <>
      <Head title="Moderation queue" sub="privacy shield, safety net, and member reports. the room stays kind because this stays current." />
      <div style={{ background: '#181020', border: '.5px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: '#9a8fa2', lineHeight: 1.5 }}>
        <span>🤖 <b style={{ color: '#c9bcd0' }}>AI triage</b> — Guardian classifies crisis · abuse · defamation · identifying detail at publish.</span>
        <span>🛡 <b style={{ color: '#c9bcd0' }}>Rules</b> — privacy shield regex flags emails, phones, names, employers, addresses.</span>
        <span>🚩 <b style={{ color: '#c9bcd0' }}>Reports</b> — members flag against room norms.</span>
        <span style={{ width: '100%', color: '#6e6675', borderTop: '.5px solid rgba(255,255,255,.06)', paddingTop: 10 }}>
          aliases + opaque ids only — never a real identity. actions are <b style={{ color: '#9a8fa2' }}>redact-only</b> (never rewrite) and <b style={{ color: '#9a8fa2' }}>append-only logged</b>.
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((it, idx) => (
          <div key={idx} style={{ ...CARD, display: 'flex', gap: 14, alignItems: 'flex-start', opacity: handled[idx] ? 0.4 : 1 }}>
            <span style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 19, flex: 'none' }}>{it.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                <span style={{ ...CHIP, background: `${it.color}22`, color: it.color }}>{it.label}</span>
                <span style={{ fontSize: 11.5, color: '#9a8fa2' }}>{it.alias}</span>
              </div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 14, lineHeight: 1.35, marginBottom: 5 }}>{it.title}</div>
              <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13, color: '#9a8fa2' }}>{it.reason}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 'none' }}>
              <button disabled={handled[idx]} style={BTN_APPROVE} onClick={() => { setHandled((h) => ({ ...h, [idx]: true })); onAction() }}>{it.kind === 'report' ? 'keep' : 'publish'}</button>
              <button disabled={handled[idx]} style={BTN_REJECT} onClick={() => { setHandled((h) => ({ ...h, [idx]: true })); onAction() }}>{it.kind === 'report' ? 'remove' : 'hold'}</button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Rooms({ rooms }: { rooms: Room[] }) {
  const rows = rooms.slice(0, 14)
  return (
    <>
      <Head title="Rooms" sub="every open room. search, sort, rest, or feature." />
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: '.5px solid rgba(255,255,255,.07)', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9a8fa2' }}>
          <span style={{ flex: 1 }}>room</span>
          <span style={{ width: 70, textAlign: 'right' }}>sitting</span>
          <span style={{ width: 70, textAlign: 'right' }}>omg same</span>
          <span style={{ width: 90, textAlign: 'right' }}>mode</span>
        </div>
        {rows.map((r) => (
          <a key={r.id} href={`/stream#room-${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '.5px solid rgba(255,255,255,.05)', textDecoration: 'none', color: 'inherit' }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 15, flex: 'none' }}>{r.emoji}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
            <span style={{ width: 70, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#c9bcd0' }}>{r.sitting}</span>
            <span style={{ width: 70, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#f7b8d4' }}>{r.relates}</span>
            <span style={{ width: 90, textAlign: 'right' }}>
              <span style={{ ...CHIP, background: r.support === 'heard' ? 'rgba(231,84,138,.16)' : 'rgba(91,138,94,.18)', color: r.support === 'heard' ? '#f7b8d4' : '#9ed4a0' }}>
                {r.support === 'heard' ? 'heard' : 'advice'}
              </span>
            </span>
          </a>
        ))}
      </div>
    </>
  )
}

function Members() {
  const members: Array<[string, string, number, number, number, string]> = [
    ['🦢','Quiet Nigerian Swan',92,38,3,'2d'],
    ['🦁','Defiant Kenyan Lion',71,54,7,'5h'],
    ['🦔','Mortified Polish Hedgehog',64,12,2,'1d'],
    ['🕊','Patient Indian Dove',88,61,4,'3h'],
    ['🦋','Wistful Ethiopian Butterfly',79,44,5,'3h'],
    ['🐇','Tender Brazilian Hare',58,22,1,'8h'],
    ['🐺','Patient Moroccan Wolf',81,73,2,'1h'],
    ['🦊','Restless Filipino Fox',47,29,6,'12h'],
  ]
  return (
    <>
      <Head title="Members" sub="pseudonymous. you see aliases and standing — never real identities." />
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '.5px solid rgba(255,255,255,.07)', fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: '#9a8fa2' }}>
          <span style={{ flex: 1 }}>alias</span>
          <span style={{ width: 80, textAlign: 'right' }}>kindness</span>
          <span style={{ width: 70, textAlign: 'right' }}>hearts</span>
          <span style={{ width: 60, textAlign: 'right' }}>rooms</span>
          <span style={{ width: 60, textAlign: 'right' }}>active</span>
        </div>
        {members.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '.5px solid rgba(255,255,255,.05)' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', fontSize: 15, flex: 'none' }}>{m[0]}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontFamily: "'Newsreader',serif", fontStyle: 'italic' }}>{m[1]}</span>
            <span style={{ width: 80, textAlign: 'right' }}>
              <span style={{ display: 'inline-block', width: 42, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.08)', overflow: 'hidden', verticalAlign: 'middle' }}>
                <span style={{ display: 'block', height: '100%', width: `${m[2]}%`, background: 'linear-gradient(90deg,#ff7eb3,#c1216b)' }} />
              </span>
            </span>
            <span style={{ width: 70, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#c9bcd0' }}>{m[3]}</span>
            <span style={{ width: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#c9bcd0' }}>{m[4]}</span>
            <span style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#9a8fa2' }}>{m[5]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Analytics() {
  const kpis: Array<[string, string, string]> = [
    ['DAU','12,408','+6.1%'],['WAU','41,920','+9.4%'],['Avg session','7m 12s','+0:48'],
    ['D7 retention','38%','+2pt'],['Spill → posted','61%','steady'],['Scan → spill','24%','+3pt'],
  ]
  const line = (vals: number[], col: string, h: number) => {
    const max = Math.max(...vals), min = Math.min(...vals)
    const w = 100 / (vals.length - 1)
    const pts = vals.map((v, i) => `${i * w},${h - ((v - min) / (max - min || 1) * (h - 4)) - 2}`).join(' ')
    return (
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h * 1.5 }}>
        <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    )
  }
  const topics: Array<[string, number, string]> = [
    ['relationships & romance',34,'#e7548a'],['family',26,'#c87c4a'],['work',18,'#EF9F27'],
    ['friendship',12,'#5B8A5E'],['money',6,'#7F77DD'],['other',4,'#9a8fa2'],
  ]
  return (
    <>
      <Head title="Analytics" sub="growth, retention, and what the rooms are about." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k[0]} style={CARD}>
            <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 23, letterSpacing: '-.02em', display: 'block', lineHeight: 1.1 }}>{k[1]}</b>
            <span style={{ fontSize: 12, color: '#9a8fa2' }}>{k[0]}</span>
            <div style={{ marginTop: 6, fontSize: 11, color: '#6fcf97' }}>{k[2]}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={CARD}>
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 10 }}>Daily active · 30 days</b>
          {line([40,44,42,50,55,53,60,58,66,70,68,75,80,78,85,88,84,92,95,90,98,104,100,110,108,116,120,118,124,130], '#e7548a', 40)}
        </div>
        <div style={CARD}>
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 10 }}>7-day retention cohort</b>
          {line([100,72,58,49,44,41,38], '#7F77DD', 40)}
        </div>
      </div>
      <div style={CARD}>
        <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 14 }}>What the rooms are about</b>
        {topics.map((c) => (
          <div key={c[0]} style={{ marginBottom: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#c9bcd0', marginBottom: 4 }}>
              <span>{c[0]}</span><b>{c[1]}%</b>
            </div>
            <div style={BAR}><i style={{ display: 'block', height: '100%', width: `${c[1]}%`, background: c[2], borderRadius: 4 }} /></div>
          </div>
        ))}
      </div>
    </>
  )
}

/* Static feedback dashboard — same visual shell as the original. Signals come
 * from platform events (previously the removed feedback-engine.js). Until the
 * native pipeline lands, this shows demo values matching the mock. */
export function FeedbackView() {
  const c = { love: 26, friction: 14, question: 9, total: 49 }
  const sentiment = 65
  const loved: Array<{ key: string; n: number }> = [
    { key: 'scan_done', n: 12 }, { key: 'spill_publish', n: 8 }, { key: 'relate', n: 7 },
    { key: 'react', n: 5 }, { key: 'return_visit', n: 4 }, { key: 'room_dwell_long', n: 3 },
  ]
  const friction: Array<{ key: string; n: number }> = [
    { key: 'spill_abandon', n: 6 }, { key: 'room_bounce', n: 4 }, { key: 'share_dismiss', n: 3 },
    { key: 'paywall_view', n: 3 }, { key: 'rage_click', n: 2 },
  ]
  const questions = [
    { text: 'is it normal to feel relieved after a breakup?', page: 'demo' },
    { text: 'rooms about going no-contact with a parent', page: 'demo' },
    { text: 'how does the mirror actually work?', page: 'demo' },
    { text: 'i need to vent about my marriage', page: 'demo' },
  ]
  const LABELS: Record<string, string> = {
    scan_done: 'Completed a scan', spill_publish: 'Published a spill', mirror_open: 'Opened the Mirror',
    relate: 'Related to a room', react: 'Reacted in a room', room_dwell_long: 'Stayed in a room',
    return_visit: 'Came back', spill_abandon: 'Left the spill midway', room_bounce: 'Bounced from a room fast',
    share_dismiss: 'Dismissed a share offer', paywall_view: 'Saw the Mirror paywall', rage_click: 'Tapped dead space (frustration)',
  }
  const label = (k: string) => LABELS[k] || k.replace(/_/g, ' ')
  const r = 30, circ = 2 * Math.PI * r, off = circ * (1 - sentiment / 100)
  const rankList = (arr: Array<{ key: string; n: number }>, col: string) => {
    const max = arr[0]?.n || 1
    return arr.slice(0, 7).map((x) => (
      <div key={x.key} style={{ marginBottom: 11 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#c9bcd0', marginBottom: 5 }}>
          <span>{label(x.key)}</span><b style={{ color: col }}>{x.n}</b>
        </div>
        <div style={BAR}><i style={{ display: 'block', height: '100%', width: `${Math.round(x.n / max * 100)}%`, background: col, borderRadius: 4 }} /></div>
      </div>
    ))
  }
  const kpi = (n: number, l: string, col: string) => (
    <div style={{ ...CARD, textAlign: 'center' }}>
      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 26, color: col }}>{n}</div>
      <div style={{ fontSize: 11, color: '#9a8fa2', marginTop: 3 }}>{l}</div>
    </div>
  )
  const ship: Array<[string, string, string]> = [
    ['#EF9F27', 'Spill interview drop-off', '‘6’ people left the interview midway — try fewer questions or a clearer "almost done" cue.'],
    ['#E24B4A', 'Rooms bounced in <4s', '‘4’ fast exits — strengthen the first screen of a room (lead with the story, not chrome).'],
    ['#7F77DD', 'Share offers dismissed', '‘3’ dismissals — lower share frequency or improve the card; respect the cool-down.'],
    ['#e7548a', 'Mirror paywall not converting', '3 paywall views, 0 unlocks — test showing one more reading free, or clearer trial framing.'],
    ['#E24B4A', 'Frustration taps detected', '‘2’ rage-clicks on dead space — something looks tappable but isn’t. audit those spots.'],
  ]
  return (
    <>
      <Head title="Feedback loop" sub="what people love, where they struggle, and what they ask — so we ship daily against real signal." />
      <div style={{ background: '#181020', border: '.5px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '13px 16px', marginBottom: 18, fontSize: 12, color: '#9a8fa2', lineHeight: 1.5 }}>
        🫶 <b style={{ color: '#c9bcd0' }}>Signal, not surveillance.</b> captured on-device from behavior, reactions, and questions to the companion — pseudonymous, alias + opaque id only. text feedback is opt-in via the companion’s “how did that land?” prompt.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 14, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <svg viewBox="0 0 72 72" style={{ width: 72, height: 72 }}>
              <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="7" />
              <circle cx="36" cy="36" r={r} fill="none" stroke="#e7548a" strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform="rotate(-90 36 36)" />
              <text x="36" y="40" textAnchor="middle" fontFamily="Sora,sans-serif" fontWeight="800" fontSize="17" fill="#f7e8f0">{sentiment}%</text>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, color: '#f7e8f0' }}>love share</div>
            <div style={{ fontSize: 11, color: '#9a8fa2' }}>of love+friction signals</div>
          </div>
        </div>
        {kpi(c.love, 'love signals', '#5DCAA5')}
        {kpi(c.friction, 'friction signals', '#EF9F27')}
        {kpi(c.question, 'questions asked', '#7F77DD')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={CARD}>
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 14, color: '#5DCAA5' }}>💚 What people love</b>
          {rankList(loved, '#5DCAA5')}
        </div>
        <div style={CARD}>
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 14, color: '#EF9F27' }}>⚠ Where they struggle</b>
          {rankList(friction, '#EF9F27')}
        </div>
      </div>
      <div style={{ ...CARD, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: '#a9a4e8' }}>🗣 What they’re asking the companion</b>
          <span style={{ fontSize: 11, color: '#9a8fa2' }}>{questions.length} recent</span>
        </div>
        {questions.map((q, i) => (
          <div key={i} style={QROW}>
            <span style={{ flex: 1, fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13.5, color: '#d8ccde' }}>“{q.text}”</span>
            <span style={{ fontSize: 10.5, color: '#6e6675', flex: 'none' }}>{q.page}</span>
          </div>
        ))}
      </div>
      <div style={CARD}>
        <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 6, color: '#f7b8d4' }}>🚢 Today’s build queue</b>
        <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 12.5, color: '#9a8fa2', marginBottom: 14 }}>auto-drafted from the strongest friction — turn signal into the next daily ship.</div>
        {ship.map((s, i) => (
          <div key={i} style={QROW}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s[0], flex: 'none', marginTop: 5, alignSelf: 'flex-start' }} />
            <span style={{ flex: 1 }}>
              <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 13, color: '#f0e6f0', display: 'block', marginBottom: 2 }}>{s[1]}</b>
              <span style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13, color: '#9a8fa2' }}>{s[2]}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function Safety({ onAction }: { onAction: () => void }) {
  const kpis: Array<[string, string, string]> = [
    ['Safety-net catches · 7d','41','routed to resources'],
    ['Awaiting human review','2','urgent'],
    ['Resource click-throughs','29','988 / Samaritans'],
    ['False positives','7','released to publish'],
  ]
  return (
    <>
      <Head title="Safety" sub="the safety net and crisis routing. these never get monetized and never auto-publish." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k[0]} style={CARD}>
            <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', display: 'block', lineHeight: 1.1 }}>{k[1]}</b>
            <span style={{ fontSize: 12, color: '#9a8fa2' }}>{k[0]}</span>
            <div style={{ marginTop: 6, fontSize: 11, color: '#9a8fa2' }}>{k[2]}</div>
          </div>
        ))}
      </div>
      <div style={{ ...CARD, borderColor: 'rgba(226,75,74,.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#E24B4A', animation: 'breathe 2s infinite' }} />
          <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, color: '#f5b0b0' }}>Awaiting human review</b>
        </div>
        {[
          '"I don\'t see the point in any of this anymore" — held, resources shown, not published.',
          'a comment expressing self-harm intent — author shown findahelpline.',
        ].map((t, i) => (
          <div key={i} style={QROW}>
            <span style={{ flex: 1, fontSize: 13.5, fontFamily: "'Newsreader',serif", fontStyle: 'italic' }}>{t}</span>
            <button style={BTN_APPROVE} onClick={onAction}>open case</button>
          </div>
        ))}
      </div>
      <div style={{ ...CARD, marginTop: 14 }}>
        <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, display: 'block', marginBottom: 8 }}>Crisis resources shown to users</b>
        <div style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 13.5, color: '#9a8fa2', lineHeight: 1.6 }}>
          988 Suicide &amp; Crisis Lifeline (US) · Samaritans 116 123 (UK) · findahelpline.com (global). these are surfaced automatically and logged here. configure regional resources in settings.
        </div>
      </div>
    </>
  )
}

function Config({ onSave, onAction }: { onSave: () => void; onAction: () => void }) {
  const Field = ({ label, val, note }: { label: string; val: string; note?: string }) => (
    <div style={QROW}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, color: '#e9dfee' }}>{label}</div>
        {note && <div style={{ fontSize: 11.5, color: '#6e6675', marginTop: 2 }}>{note}</div>}
      </div>
      <input defaultValue={val} style={{ width: 90, background: '#0f0a12', border: '.5px solid rgba(255,255,255,.14)', borderRadius: 8, padding: '7px 10px', color: '#f2e9ef', fontFamily: 'Inter', fontSize: 13, textAlign: 'right' }} />
    </div>
  )
  const Grp = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ ...CARD, marginBottom: 14 }}>
      <b style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 12 }}>{title}</b>
      {children}
    </div>
  )
  return (
    <>
      <Head title="Platform config" sub="the tunable constants. every change is logged. SPEC §8 launch values live here." />
      <Grp title="Rest & lifecycle">
        <Field label="rest window (hours)" val="72" note="silence before a room rests" />
      </Grp>
      <Grp title="Resonance & Hall of Fame">
        <Field label="relate weight" val="3" />
        <Field label="reaction weight" val="1" />
        <Field label="side-added weight" val="25" />
        <Field label="teller-heard bonus" val="40" />
        <Field label="Held band" val="120" note="min score to induct" />
        <Field label="Honored band" val="300" />
        <Field label="Legend band" val="700" />
      </Grp>
      <Grp title="Geography">
        <Field label="city activation" val="500" note="rested rooms to open a city hall" />
      </Grp>
      <Grp title="Safety & moderation">
        <Field label="crisis auto-publish" val="off" note="never — locked" />
        <Field label="mod SLA target (hrs)" val="4" />
        <div style={QROW}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: '#e9dfee' }}>crisis resources</div>
            <div style={{ fontSize: 11.5, color: '#6e6675', marginTop: 2 }}>988 · Samaritans · findahelpline — per country</div>
          </div>
          <span style={{ fontSize: 12.5, color: '#f7b8d4', cursor: 'pointer' }} onClick={onAction}>edit directory →</span>
        </div>
        <div style={QROW}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: '#e9dfee' }}>break-glass identity reveal</div>
            <div style={{ fontSize: 11.5, color: '#6e6675', marginTop: 2 }}>not built — legal handled out-of-band, manually</div>
          </div>
          <span style={{ fontSize: 12, color: '#6e6675' }}>🔒 disabled</span>
        </div>
      </Grp>
      <Grp title="Audit">
        <div style={QROW}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, color: '#e9dfee' }}>action log</div>
            <div style={{ fontSize: 11.5, color: '#6e6675', marginTop: 2 }}>append-only · every action attributed · exportable</div>
          </div>
          <span style={{ fontSize: 12.5, color: '#f7b8d4', cursor: 'pointer' }} onClick={onAction}>open log →</span>
        </div>
      </Grp>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button style={{ ...BTN_APPROVE, padding: '9px 18px' }} onClick={onSave}>save changes (logged)</button>
      </div>
    </>
  )
}

/* ── Shell + toast + navigation ──────────────────────────────────── */

interface AdminShellProps { initialView?: ViewKey }
export function AdminShell({ initialView = 'overview' }: AdminShellProps) {
  useNoIndex()
  const [view, setView] = useState<ViewKey>(initialView)
  const [pending, setPending] = useState(5)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const tref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rooms = (SHUTAP_SEED.rooms || []) as Room[]

  const toast = (m: string) => {
    setToastMsg(m)
    if (tref.current) clearTimeout(tref.current)
    tref.current = setTimeout(() => setToastMsg(null), 3000)
  }
  useEffect(() => () => { if (tref.current) clearTimeout(tref.current) }, [])

  const gotoQueue = () => setView('queue')
  const decQueue = () => { setPending((n) => Math.max(0, n - 1)); toast('actioned.') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0a12', color: '#f2e9ef', fontFamily: "'Inter',system-ui,sans-serif", fontSize: 15 }}>
      <style>{`
        @keyframes adminFadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @keyframes breathe { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
      `}</style>
      {/* SIDEBAR */}
      <aside style={{ width: 228, flex: 'none', borderRight: '.5px solid rgba(255,255,255,.08)', padding: '18px 14px', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', gap: 4, background: '#0c080f' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: '#f2e9ef', padding: '6px 10px 16px' }}>
          <span style={{ width: 30, height: 21, display: 'block' }}>
            <svg viewBox="0 0 140 96" fill="none" style={{ display: 'block', width: '100%', height: '100%' }}>
              <defs>
                <radialGradient id="admEyeG" cx="40%" cy="18%" r="75%">
                  <stop offset="0%" stopColor="#fff" /><stop offset="18%" stopColor="#ffd0e8" />
                  <stop offset="48%" stopColor="#f060a0" /><stop offset="78%" stopColor="#c0206a" />
                  <stop offset="100%" stopColor="#880040" />
                </radialGradient>
                <radialGradient id="admPupG" cx="50%" cy="55%" r="58%">
                  <stop offset="0%" stopColor="#3a1020" /><stop offset="100%" stopColor="#060106" />
                </radialGradient>
              </defs>
              <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#admEyeG)" />
              <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#admEyeG)" />
              <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#admPupG)" />
              <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#admPupG)" />
            </svg>
          </span>
          <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: '-.04em' }}>
            shut<span style={{ color: '#e7548a' }}>ap</span>
          </span>
          <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9a8fa2', border: '.5px solid rgba(255,255,255,.16)', borderRadius: 5, padding: '2px 5px' }}>admin</span>
        </a>
        {NAV.map((n) => {
          const active = view === n.k
          return (
            <div
              key={n.k}
              onClick={() => setView(n.k)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
                borderRadius: 11, fontFamily: "'Sora',sans-serif", fontWeight: 600, fontSize: 13.5,
                cursor: 'pointer', transition: '.15s',
                color: active ? '#fff' : '#a99fb0',
                background: active ? 'linear-gradient(135deg,rgba(231,84,138,.22),rgba(193,33,107,.16))' : 'transparent',
              }}
            >
              <span>{n.icon}</span> {n.label}
              {n.k === 'queue' && pending > 0 && (
                <span style={{ marginLeft: 'auto', background: '#e7548a', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '1px 7px' }}>{pending}</span>
              )}
            </div>
          )
        })}
        <div style={{ marginTop: 'auto', padding: '12px 10px', fontSize: 11.5, color: '#6e6675', fontFamily: "'Newsreader',serif", fontStyle: 'italic' }}>
          signed in as<br /><b style={{ fontStyle: 'normal', fontFamily: 'Inter', color: '#a99fb0' }}>admin@shutap.com</b>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0, padding: '26px 30px 60px', maxWidth: 1000 }}>
        <div key={view} style={{ animation: 'adminFadeUp .3s ease' }}>
          {view === 'overview'  && <Overview onGoto={gotoQueue} />}
          {view === 'queue'     && <Queue rooms={rooms} onAction={decQueue} />}
          {view === 'rooms'     && <Rooms rooms={rooms} />}
          {view === 'users'     && <Members />}
          {view === 'analytics' && <Analytics />}
          {view === 'feedback'  && <FeedbackView />}
          {view === 'safety'    && <Safety onAction={() => toast('case opened — handle with care.')} />}
          {view === 'config'    && <Config onSave={() => toast('config saved — written to the audit log.')} onAction={() => toast('opening…')} />}
        </div>
      </main>

      {/* TOAST */}
      <div
        style={{
          position: 'fixed', left: '50%', bottom: 26, zIndex: 92,
          background: '#fff', borderRadius: 999, padding: '11px 18px',
          color: '#0b080f', fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14,
          boxShadow: '0 20px 44px -20px rgba(0,0,0,.5)', transition: 'transform .4s cubic-bezier(.2,.7,.2,1)',
          transform: `translate(-50%, ${toastMsg ? '0px' : '300px'})`,
        }}
      >
        {toastMsg}
      </div>
    </div>
  )
}

export function AdminPage() {
  return <AdminShell />
}
