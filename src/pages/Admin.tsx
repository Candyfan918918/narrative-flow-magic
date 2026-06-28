/* Admin home — minimal React (was an iframe). */
import { Link } from 'react-router-dom'
import { Header } from '@/components/Header'

export function AdminPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header />
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '36px 22px 80px' }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '.18em', color: '#9e7a8c' }}>ADMIN</div>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 28, margin: '6px 0 16px' }}>admin</h1>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
          <li><Link style={card} to="/admin/feedback">feedback dashboard →</Link></li>
          <li><Link style={card} to="/admin/relate-queue">relate queue →</Link></li>
        </ul>
      </main>
    </div>
  )
}
const card: React.CSSProperties = { display: 'block', padding: '14px 16px', background: '#fff', borderRadius: 14, border: '.5px solid rgba(11,8,15,.08)', textDecoration: 'none', color: '#0b080f', fontFamily: 'Sora,sans-serif', fontSize: 14 }
