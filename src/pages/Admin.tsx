/* Pixel-perfect port of project/Admin.dc.html — served verbatim,
   with a small floating nav so admins can reach the React-built
   Feedback dashboard. */
import { Link } from 'react-router-dom'
import { useNoIndex } from '@/components/NoIndex'

export function AdminPage() {
  useNoIndex()
  return (
    <>
      <iframe
        src="/shutap/Admin.dc.html"
        title="Shutap — Admin"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#fdf0f5' }}
      />
      <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 10, display: 'flex', gap: 8 }}>
        <Link to="/admin/relate-queue" style={navBtn('#0b080f')}>🤝 relate queue</Link>
        <Link to="/admin/feedback" style={navBtn('#c1216b')}>🫶 feedback</Link>
      </div>
    </>
  )
}

const navBtn = (bg: string): React.CSSProperties => ({
  background: bg, color: '#fff', textDecoration: 'none',
  padding: '8px 14px', borderRadius: 999, fontWeight: 600, fontSize: 13,
  boxShadow: '0 6px 18px rgba(11,8,15,.25)',
  fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
})
