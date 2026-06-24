import { Link } from 'react-router-dom'
import { ScaffoldShell, Eyebrow, Title, Lead } from '../components/ScaffoldShell'

/* Scaffold. The full Landing (Spill / Scan / Identity ceremony / Mirror) is a
   large surface in the design bundle; this stub establishes the brand shell and
   routes into the fully-built Stream. */
export function LandingPage() {
  return (
    <ScaffoldShell>
      <Eyebrow>a quieter place to be heard</Eyebrow>
      <Title>shutap.</Title>
      <Lead>
        pseudonymous · your real name never shows · your story, your rules 🤍 venting is free — say what happened, and the
        room holds it with you.
      </Lead>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Link
          to="/stream"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg,#f060a0,#c1216b)',
            color: '#fff',
            borderRadius: 999,
            padding: '12px 22px',
            fontFamily: 'Sora,sans-serif',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          enter the stream →
        </Link>
        <Link
          to="/halls"
          className="prose-link"
          style={{ alignSelf: 'center', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15 }}
        >
          rooms the world remembered →
        </Link>
      </div>

      <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 13.5, color: '#9e7a8c', marginTop: 40 }}>
        Stream is the fully-built screen in this implementation. Spill, Scan, the identity ceremony, and the Mirror are
        described in the design bundle and scaffolded here.
      </p>
    </ScaffoldShell>
  )
}
