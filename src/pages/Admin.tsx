/* Pixel-perfect port of project/Admin.dc.html — served verbatim,
   with a small floating nav so admins can reach the React-built
   Feedback dashboard. */
import { Link } from 'react-router-dom'

export function AdminPage() {
  return (
    <>
      <iframe
        src="/shutap/Admin.dc.html"
        title="Shutap — Admin"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#fdf0f5' }}
      />
      <Link
        to="/admin/feedback"
        style={{
          position: 'fixed', top: 14, right: 14, zIndex: 10,
          background: '#c1216b', color: '#fff', textDecoration: 'none',
          padding: '8px 14px', borderRadius: 999, fontWeight: 600, fontSize: 13,
          boxShadow: '0 6px 18px rgba(193,33,107,.35)',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >🫶 feedback</Link>
    </>
  )
}
