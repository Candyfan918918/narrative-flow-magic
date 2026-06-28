/* Owner menu for a situation (room/journal/scan) — edit / move / delete. */
import { useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { useNavigate } from 'react-router-dom'
import { updateSituation, deleteSituation } from '@/lib/situations.functions'

export function OwnerMenu({ id, isPublic, onChange }: { id: string; isPublic: boolean; onChange?: () => void }) {
  const navigate = useNavigate()
  const update = useServerFn(updateSituation)
  const del = useServerFn(deleteSituation)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function flip() {
    setBusy(true)
    try { await update({ data: { id, is_public: !isPublic } }); onChange?.() } finally { setBusy(false); setOpen(false) }
  }
  async function remove() {
    if (!confirm('delete this? you have a few days to undo before purge.')) return
    setBusy(true)
    try { await del({ data: { id } }); onChange?.(); navigate('/profile') } finally { setBusy(false); setOpen(false) }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} aria-label="owner menu" style={dot}>⋯</button>
      {open && (
        <div style={menu}>
          <button disabled={busy} onClick={flip} style={menuItem}>
            {isPublic ? '→ move to private journal' : '→ post to a room'}
          </button>
          <button disabled={busy} onClick={remove} style={{ ...menuItem, color: '#c1216b' }}>delete</button>
        </div>
      )}
    </div>
  )
}

const dot: React.CSSProperties = { background: 'transparent', border: 0, fontSize: 22, color: '#9e7a8c', cursor: 'pointer', padding: '0 6px' }
const menu: React.CSSProperties = { position: 'absolute', right: 0, top: '100%', background: '#fff', border: '.5px solid rgba(11,8,15,.1)', borderRadius: 12, boxShadow: '0 6px 22px rgba(0,0,0,.1)', minWidth: 200, padding: 6, zIndex: 30 }
const menuItem: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 0, padding: '10px 12px', borderRadius: 8, fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#4a3040', cursor: 'pointer' }
