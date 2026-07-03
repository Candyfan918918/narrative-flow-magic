/* Pixel-perfect port of project/Admin.dc.html — served verbatim,
 * mounted below the GlobalHeader (which provides the admin sub-nav). */
import { useNoIndex } from '@/components/NoIndex'

export function AdminPage() {
  useNoIndex()
  return (
    <iframe
      src="/shutap/Admin.dc.html"
      title="Shutap — Admin"
      style={{ display: 'block', width: '100%', height: 'calc(100vh - 96px)', border: 0, background: '#fdf0f5' }}
    />
  )
}
