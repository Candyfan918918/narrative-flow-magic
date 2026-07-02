/* Real React Stream page. Replaces the iframe-ported Shutap-Stream.dc.html.
 * Renders seed rooms + user-published rooms from localStorage (the same
 * dynamic source the iframe used). Scan rooms render as score-card tiles. */
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { RoomTile, type RoomTileData } from '../components/RoomTile'
import { RoomDetail } from '../components/RoomDetail'
import { useToast } from '../components/Toast'
import { SHUTAP_SEED } from '../data/seed'
import type { Room } from '../data/types'
import { listPillars } from '../lib/pillars.functions'
import { useNoIndex } from '@/components/NoIndex'


type Filter = 'all' | 'heard' | 'advice' | 'scan'

interface StoredRoom {
  id: string
  alias?: string
  emoji?: string
  title?: string
  body?: string
  reflection?: string
  hall?: Room['hall']
  support?: Room['support']
  hours?: string
  relates?: number
  sitting?: number
  reactions?: Room['reactions']
  kind?: 'spill' | 'scan'
  initial_scan?: number | null
  scan_band?: RoomTileData['scan_band']
  scan_signature?: string | null
  pillar?: string | null
}

function loadUserRooms(): RoomTileData[] {
  try {
    const raw = localStorage.getItem('shutap_user_situations')
    if (!raw) return []
    const arr = JSON.parse(raw) as StoredRoom[]
    return arr.map(
      (r): RoomTileData => ({
        id: r.id,
        alias: r.alias || 'someone',
        emoji: r.emoji || '🩷',
        title: r.title || 'untitled',
        body: r.body || '',
        reflection: r.reflection || '',
        hall: (r.hall as Room['hall']) || 'healing',
        support: (r.support as Room['support']) || 'heard',
        hours: r.hours || 'just now',
        relates: r.relates ?? 0,
        sitting: r.sitting ?? 1,
        reactions: r.reactions || { heard: 0, same: 0, strong: 0, time: 0, brave: 0 },
        kind: r.kind,
        initial_scan: r.initial_scan ?? null,
        scan_band: r.scan_band ?? null,
        scan_signature: r.scan_signature ?? null,
        pillar: r.pillar ?? null,
      }),
    )
  } catch {
    return []
  }
}

export function StreamPage() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  const [filter, setFilter] = useState<Filter>('all')
  const { toast: toastMsg, ToastHost } = useToast()
  const [open, setOpen] = useState<RoomTileData | null>(null)
  const [version, setVersion] = useState(0)
  const [openedPillars, setOpenedPillars] = useState<string[] | null>(null)

  // Refresh when storage changes (publish from spill / scan)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'shutap_user_situations') setVersion((v) => v + 1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Phase 2c — load opened pillars once
  useEffect(() => {
    listPillars()
      .then((rows) => {
        const now = Date.now()
        setOpenedPillars(
          rows.filter((r) => r.opened_at && new Date(r.opened_at).getTime() <= now).map((r) => r.pillar),
        )
      })
      .catch(() => setOpenedPillars(['relationships']))
  }, [])

  const rooms = useMemo<RoomTileData[]>(() => {
    const seed = (SHUTAP_SEED.rooms || []) as RoomTileData[]
    const user = loadUserRooms()
    return [...user, ...seed]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  const filtered = useMemo(() => {
    // Pillar gate: hide user rooms tagged with a closed pillar. Seed rooms
    // (no pillar tag) and the currently-opened pillars are always allowed.
    const opened = openedPillars ?? ['relationships']
    const pillarGated = rooms.filter((r) => !r.pillar || opened.includes(r.pillar))
    if (filter === 'all') return pillarGated
    if (filter === 'scan') return pillarGated.filter((r) => r.kind === 'scan')
    return pillarGated.filter((r) => r.support === filter && r.kind !== 'scan')
  }, [rooms, filter, openedPillars])


  // Honor /stream#room-<id> deep links from the spill publish flow
  useEffect(() => {
    if (!hash) return
    const m = hash.match(/^#room-(.+)$/)
    if (!m) return
    const id = decodeURIComponent(m[1])
    const r = rooms.find((x) => x.id === id)
    if (r) setOpen(r)
  }, [hash, rooms])

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header onToast={toastMsg} />



      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 22px 90px' }}>
        {/* page eyebrow */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9e7a8c', marginBottom: 6 }}>
            the stream
          </div>
          <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 'clamp(22px,4vw,30px)', margin: 0, color: '#0b080f', letterSpacing: '-.02em' }}>
            rooms open right now
          </h1>
          <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14.5, color: '#6b4a5c', margin: '6px 0 0' }}>
            sit in one. don't fix anything. just be there.
          </p>
        </div>

        {/* filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {(['all', 'heard', 'advice', 'scan'] as Filter[]).map((f) => {
            const active = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: '.5px solid ' + (active ? '#e7548a' : 'rgba(11,8,15,.12)'),
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#c1216b' : '#6b4a5c',
                  fontFamily: 'Sora,sans-serif',
                  fontWeight: 600,
                  fontSize: 11.5,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: '.18s',
                }}
              >
                {f === 'all' ? 'all rooms' : f === 'scan' ? 'scans ✦' : f === 'heard' ? 'looking to be heard' : 'open to advice'}
              </button>
            )
          })}
        </div>

        {/* grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map((r) => (
            <RoomTile key={r.id} room={r} onOpen={(room) => setOpen(room)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#9e7a8c' }}>
            no rooms here yet.{' '}
            <span style={{ color: '#c1216b', cursor: 'pointer' }} onClick={() => navigate('/')}>
              open one →
            </span>
          </div>
        )}
      </main>

      {open && (
        <RoomDetail
          room={open as Room}
          onBack={() => {
            setOpen(null)
            if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
          }}
          toast={toastMsg}
        />
      )}

      {ToastHost}
    </div>
  )
}
