import { ScaffoldShell, Eyebrow, Title, Lead } from '../components/ScaffoldShell'
import { getRooms } from '../data/constants'

/* Scaffold. The full Admin dashboard (moderation queue, Privacy Shield /
   Guardian signals, platform config, health-first analytics) is in the bundle;
   this stub shows the governing banner and a couple of headline stats. */
export function AdminPage() {
  const rooms = getRooms()
  const totalRelates = rooms.reduce((a, r) => a + (r.relates || 0), 0)
  const sittingNow = rooms.reduce((a, r) => a + (r.sitting || 0), 0)

  const stat = (label: string, value: string) => (
    <div style={{ background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 16, padding: '18px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 26, color: '#0b080f' }}>{value}</div>
      <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9e7a8c', marginTop: 4 }}>{label}</div>
    </div>
  )

  return (
    <ScaffoldShell>
      <Eyebrow>operators only</Eyebrow>
      <Title>admin.</Title>
      <Lead>health-first analytics and redact-only moderation. aliases / opaque ids only — no real identity ever surfaces here.</Lead>

      <div
        style={{
          background: 'linear-gradient(160deg,#2e0d1a,#1a0a12)',
          color: '#f7e8f0',
          borderRadius: 14,
          padding: '14px 18px',
          fontFamily: 'Newsreader,serif',
          fontStyle: 'italic',
          fontSize: 14,
          marginBottom: 22,
        }}
      >
        signals come from Privacy Shield (rules), Guardian (AI), and member reports. moderation is redact-only and
        append-only logged — never a rewrite.
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {stat('rooms (seed)', String(rooms.length))}
        {stat("'omg same'", totalRelates.toLocaleString())}
        {stat('sitting now', sittingNow.toLocaleString())}
      </div>
    </ScaffoldShell>
  )
}
