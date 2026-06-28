/* Admin feedback — minimal React placeholder (was iframe). */
import { Link } from 'react-router-dom'
import { Header } from '@/components/Header'

export function AdminFeedbackPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header />
      <main style={{ maxWidth: 940, margin: '0 auto', padding: '36px 22px 80px' }}>
        <Link to="/admin" style={{ color: '#9e7a8c', fontSize: 12, fontFamily: 'Sora,sans-serif' }}>← admin</Link>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 26, margin: '8px 0' }}>feedback</h1>
        <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#4a3040' }}>
          live ring buffer of love / friction events is being moved into the real React dashboard. for now, use the <Link to="/admin/relate-queue" style={{ color: '#c1216b' }}>relate queue</Link> and the database directly.
        </p>
      </main>
    </div>
  )
}
