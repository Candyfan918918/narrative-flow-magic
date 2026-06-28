/* Legal / Trust hub — minimal React (was iframe). Links to the real legal routes. */
import { Link } from 'react-router-dom'
import { Header } from '@/components/Header'

const PAGES = [
  ['/about', 'about'],
  ['/methodology', 'methodology'],
  ['/safety', 'safety'],
  ['/guidelines', 'guidelines'],
  ['/privacy', 'privacy'],
  ['/terms', 'terms'],
  ['/trust', 'trust'],
  ['/ai-disclosure', 'ai disclosure'],
  ['/report', 'report'],
  ['/contact', 'contact'],
]

export function LegalPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header />
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '36px 22px 80px' }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '.18em', color: '#9e7a8c' }}>LEGAL · TRUST</div>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 28, margin: '6px 0 18px' }}>shutap's footprint</h1>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
          {PAGES.map(([href, label]) => (
            <li key={href}><Link to={href} style={item}>{label} →</Link></li>
          ))}
        </ul>
      </main>
    </div>
  )
}
const item: React.CSSProperties = { display: 'block', padding: '12px 14px', background: '#fff', borderRadius: 12, border: '.5px solid rgba(11,8,15,.08)', textDecoration: 'none', color: '#0b080f', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15 }
