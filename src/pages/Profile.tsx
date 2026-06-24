import { getAlias } from '../lib/auth'
import { ScaffoldShell, Eyebrow, Title, Lead } from '../components/ScaffoldShell'

/* Scaffold. The full Profile (handle, settings screens, standing, Mirror /
   subscription) is described in the bundle; this stub shows the member's alias
   and the brand shell. */
export function ProfilePage() {
  const alias = getAlias()
  return (
    <ScaffoldShell>
      <Eyebrow>your standing</Eyebrow>
      <Title>your profile.</Title>
      <Lead>your private self, kept pseudonymous. settings, standing, and the Mirror live here.</Lead>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#fff',
          border: '.5px solid rgba(11,8,15,.08)',
          borderRadius: 18,
          padding: '20px 22px',
          boxShadow: '0 10px 28px -22px rgba(60,10,30,.28)',
        }}
      >
        <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#f060a0,#890041)', display: 'grid', placeItems: 'center', fontSize: 24, flex: 'none' }}>
          {alias?.emoji || '🦉'}
        </span>
        <div>
          <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 19, color: '#0b080f' }}>{alias?.name || 'not signed in'}</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: '#9e7a8c', marginTop: 3 }}>
            pseudonymous member
          </div>
        </div>
      </div>
    </ScaffoldShell>
  )
}
