import { createFileRoute, notFound } from '@tanstack/react-router'
import { AdminPage } from '@/pages/Admin'
import { amIAdmin } from '@/lib/admin.functions'

export const Route = createFileRoute('/admin')({
  ssr: false,
  head: () => ({ meta: [{ title: 'Admin — Shutap' }, { name: 'robots', content: 'noindex' }] }),
  beforeLoad: async () => {
    try {
      const ok = await amIAdmin()
      if (!ok) throw notFound()
    } catch (e) {
      // notFound() throws — rethrow it; anything else (network / unauth) → 404
      throw notFound()
    }
  },
  component: AdminPage,
  notFoundComponent: () => (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fdf0f5', color: '#0b080f', fontFamily: 'Sora,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 42, margin: 0 }}>404</h1>
        <p style={{ color: '#6b4a5c', fontFamily: 'Newsreader,serif', fontStyle: 'italic' }}>nothing here.</p>
        <a href="/" style={{ color: '#c1216b' }}>← home</a>
      </div>
    </div>
  ),
})
