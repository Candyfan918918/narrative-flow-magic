import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Room } from '../data/types'
import { NUDGES, REACTIONS, getRooms } from '../data/constants'
import { complete, extractJSON } from '../lib/ai'
import { Header } from '../components/Header'
import { CompanionBubble } from '../components/CompanionBubble'
import { RoomDetail } from '../components/RoomDetail'
import { useToast } from '../components/Toast'
import { eyeSVG } from '../components/EyeDefs'

const CRISIS =
  /\b(kill myself|end it all|don'?t want to (be here|live|exist)|want to (die|disappear|vanish)|suicid|self.?harm|no reason to live|better off dead|hurt myself)\b/i

function esc(s: string) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function StreamPage() {
  const navigate = useNavigate()
  const { toast, ToastHost } = useToast()

  const rooms = useMemo(() => getRooms(), [])
  const byId = useMemo(() => {
    const m: Record<string, Room> = {}
    rooms.forEach((r) => (m[r.id] = r))
    return m
  }, [rooms])

  const [roomOrder, setRoomOrder] = useState<string[]>(() => rooms.map((r) => r.id))
  const [reshape, setReshape] = useState<{ visible: boolean; q: string; line: string }>({
    visible: false,
    q: '',
    line: 'rooms that feel closest are up front.',
  })

  // ── room overlay routing via #room-<id> (faithful to the prototype) ──
  const [roomId, setRoomId] = useState<string | null>(null)
  useEffect(() => {
    const route = () => {
      const h = window.location.hash
      setRoomId(h.startsWith('#room-') ? h.replace('#room-', '') : null)
    }
    route()
    window.addEventListener('hashchange', route)
    return () => window.removeEventListener('hashchange', route)
  }, [])
  const currentRoom = roomId ? byId[roomId] : null
  useEffect(() => {
    document.body.style.overflow = currentRoom ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [currentRoom])

  // ── ask / reshape overlay ──
  const [askOpen, setAskOpen] = useState(false)
  const [askReply, setAskReply] = useState<React.ReactNode>(null)
  const askInputRef = useRef<HTMLInputElement>(null)

  const applyAsk = useCallback(
    async (q: string) => {
      if (!q) return
      setReshape({ visible: true, q, line: 'rooms that feel closest are up front.' })
      try {
        const items = rooms.map((r) => r.id + '·' + r.title.slice(0, 60) + '·' + r.hall).join('\n')
        const prompt =
          'You are the companion on Shutap. User asked: "' +
          q +
          '". Rooms available:\n' +
          items +
          '\n\nReturn JSON only: {"line":"one warm sentence (lowercase) naming what you found","order":["id",...]}\nOrder all room ids by relevance, most relevant first.'
        const raw = await complete({ messages: [{ role: 'user', content: prompt }] })
        const res = extractJSON<{ line?: string; order?: string[] }>(raw)
        if (res.order) setRoomOrder(res.order.map(String).filter((id) => byId[id]))
        if (res.line) setReshape((prev) => ({ ...prev, line: res.line! }))
      } catch {
        /* keep default reshape line + existing order */
      }
    },
    [rooms, byId],
  )

  // honor ?ask= on first load
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const ask = sp.get('ask')
    if (ask) applyAsk(ask)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runAsk = useCallback(async () => {
    const q = (askInputRef.current?.value || '').trim()
    if (!q) return
    if (CRISIS.test(q)) {
      setAskReply(
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <span dangerouslySetInnerHTML={{ __html: eyeSVG(20, 15) }} />
          <div>
            <div style={{ color: '#f7e8f0', marginBottom: 7 }}>that’s not a search — and you don’t have to carry it alone.</div>
            <div style={{ fontFamily: 'Inter', fontSize: 12.5, color: '#f7b8d4', lineHeight: 1.7 }}>
              988 (US) · Samaritans 116 123 (UK) · findahelpline.com
            </div>
          </div>
        </div>,
      )
      return
    }
    setAskReply(
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s infinite' }} />
        <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s .2s infinite' }} />
        <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s .4s infinite' }} />
      </span>,
    )
    await applyAsk(q)
    setAskOpen(false)
    setAskReply(null)
    const url = new URL(window.location.href)
    url.searchParams.set('ask', q)
    window.history.pushState({}, '', url)
  }, [applyAsk])

  const goSpill = () => navigate('/#spill')

  // ── feed (two-column waterfall, nudges woven in after index 1 and 3) ──
  const col1: React.ReactNode[] = []
  const col2: React.ReactNode[] = []
  roomOrder.forEach((id, i) => {
    const r = byId[id]
    if (!r) return
    const col = i % 2 === 0 ? col1 : col2
    col.push(<RoomTile key={'r' + id} room={r} />)
    if (i === 1) col.push(<NudgeTile key="n0" msg={NUDGES[0]} onSpill={goSpill} />)
    if (i === 3) col.push(<NudgeTile key="n1" msg={NUDGES[1]} onSpill={goSpill} />)
  })

  return (
    <>
      <Header onToast={toast} />

      <main>
        <section style={{ padding: '32px 0 8px' }}>
          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 22px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'Newsreader,serif',
                fontStyle: 'italic',
                fontSize: 14,
                color: '#6b4a5c',
                marginBottom: 10,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5DCAA5', animation: 'breathe 3s ease-in-out infinite', display: 'block' }} />
              rooms open right now
            </div>
            <h1
              style={{
                fontFamily: 'Newsreader,serif',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(26px,5vw,36px)',
                lineHeight: 1.2,
                margin: '0 0 8px',
                color: '#0b080f',
              }}
            >
              the stream.
            </h1>
            <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15.5, color: '#6b4a5c', margin: 0, maxWidth: '46ch' }}>
              no algorithm. no upvotes. the room reshapes only when you ask it to.
            </p>

            {reshape.visible && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    background: 'linear-gradient(160deg,#2e0d1a,#1a0a12)',
                    borderRadius: 14,
                    padding: '15px 18px',
                    color: '#f7e8f0',
                    display: 'flex',
                    gap: 11,
                    alignItems: 'flex-start',
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: eyeSVG(20, 15) }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#f7b8d4', marginBottom: 5 }}>
                      reshaped for — "{esc(reshape.q)}"
                    </div>
                    <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15, color: '#f7e8f0', lineHeight: 1.5 }}>{reshape.line}</div>
                  </div>
                  <span
                    role="button"
                    onClick={() => {
                      setReshape((p) => ({ ...p, visible: false }))
                      setRoomOrder(rooms.map((r) => r.id))
                    }}
                    style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 12, color: '#9e7a8c', cursor: 'pointer', flex: 'none' }}
                  >
                    restore →
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        <section style={{ padding: '16px 0 60px' }}>
          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 22px' }}>
            <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 13, minWidth: 0 }}>{col1}</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 13, minWidth: 0 }}>{col2}</div>
            </div>
            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: '.5px solid rgba(11,8,15,.08)',
                textAlign: 'center',
                fontFamily: 'Newsreader,serif',
                fontStyle: 'italic',
                fontSize: 15,
                color: '#6b4a5c',
              }}
            >
              something happened to you too.{' '}
              <span className="prose-link" onClick={goSpill}>
                the room is open. →
              </span>
            </div>
          </div>
        </section>
      </main>

      {currentRoom && (
        <RoomDetail room={currentRoom} toast={toast} onBack={() => (window.location.hash = '')} />
      )}

      <CompanionBubble onOpen={() => setAskOpen(true)} elevated={!!currentRoom} />

      {askOpen && (
        <AskOverlay
          inputRef={askInputRef}
          reply={askReply}
          onClose={() => {
            setAskOpen(false)
            setAskReply(null)
          }}
          onRun={runAsk}
        />
      )}

      {ToastHost}
    </>
  )
}

/* ── feed tiles ────────────────────────────────────────────────────────── */
function RoomTile({ room }: { room: Room }) {
  const bars = REACTIONS.map((rx) => (
    <span key={rx.k} style={{ flex: room.reactions[rx.k], background: rx.color, height: '100%' }} />
  ))
  const heard = room.support === 'heard'
  return (
    <div className={'rtile' + (room.rested ? ' rested' : '')} onClick={() => (window.location.hash = '#room-' + room.id)}>
      <div style={{ padding: '15px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: heard ? 'rgba(231,84,138,.08)' : 'rgba(91,138,94,.10)',
              color: heard ? '#c1216b' : '#3a6b3c',
              border: '.5px solid ' + (heard ? 'rgba(193,33,107,.18)' : 'rgba(91,138,94,.22)'),
              borderRadius: 999,
              padding: '4px 10px',
              fontFamily: 'Sora,sans-serif',
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: '.05em',
            }}
          >
            {heard ? 'looking to be heard' : 'open to advice'}
          </span>
          {room.rested && (
            <span
              style={{
                fontFamily: 'Sora,sans-serif',
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: '.05em',
                color: '#9e7a8c',
                border: '.5px solid rgba(158,122,140,.25)',
                borderRadius: 999,
                padding: '4px 9px',
              }}
            >
              rested
            </span>
          )}
          <span style={{ fontSize: 11.5, color: '#9e7a8c', fontFamily: 'Newsreader,serif', fontStyle: 'italic', marginLeft: 'auto' }}>{room.hours}</span>
        </div>
        <h4 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 15, lineHeight: 1.28, margin: '0 0 10px', color: '#0b080f' }}>{room.title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#f7e8f0', display: 'grid', placeItems: 'center', fontSize: 12, flex: 'none' }}>{room.emoji}</span>
          <span style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 12.5, color: '#6b4a5c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.alias}</span>
        </div>
        <div style={{ marginBottom: 9 }}>
          <div style={{ height: 6, borderRadius: 3, overflow: 'hidden', display: 'flex', gap: 1 }}>{bars}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 12.5, color: '#9e7a8c' }}>
          <span>
            <b style={{ color: '#c1216b', fontStyle: 'normal' }}>{room.relates}</b> said 'omg same'
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5DCAA5', animation: 'breathe 2.8s ease-in-out infinite', display: 'block' }} />
            {room.sitting} in
          </span>
        </div>
      </div>
    </div>
  )
}

function NudgeTile({ msg, onSpill }: { msg: string; onSpill: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onSpill}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      style={{
        background: '#fff',
        border: '1px dashed ' + (hover ? '#e7548a' : 'rgba(11,8,15,.16)'),
        borderRadius: 16,
        padding: '18px 16px',
        cursor: 'pointer',
        transition: 'transform .18s,border-color .18s',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        <span dangerouslySetInnerHTML={{ __html: eyeSVG(24, 17) }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15, lineHeight: 1.45, color: '#0b080f', marginBottom: 8 }}>{msg}</div>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, color: '#e7548a' }}>say something →</div>
        </div>
      </div>
    </div>
  )
}

/* ── ask / reshape overlay ─────────────────────────────────────────────── */
function AskOverlay({
  inputRef,
  reply,
  onClose,
  onRun,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  reply: React.ReactNode
  onClose: () => void
  onRun: () => void
}) {
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [inputRef])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 85, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(10,5,14,.55)', backdropFilter: 'blur(6px)' }} />
      <div
        role="dialog"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 560,
          background: 'linear-gradient(160deg,#2e0d1a,#1a0a12)',
          border: '.5px solid rgba(255,255,255,.16)',
          borderRadius: '22px 22px 0 0',
          padding: 22,
          animation: 'slideUp .3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <svg viewBox="0 0 140 96" fill="none" style={{ width: 22, height: 16, flex: 'none' }}>
            <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
            <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG)" />
            <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG)" />
            <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG)" />
          </svg>
          <div style={{ flex: 1, fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#f7e8f0' }}>
            tell me what you're looking for. the rooms will reshape.
          </div>
          <div onClick={onClose} role="button" style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 13, color: '#9e7a8c', cursor: 'pointer' }}>
            close
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.14)',
            borderRadius: 14,
            padding: '12px 14px',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={'"marriage rooms" · "something funny" · "rooms like mine"'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRun()
            }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f7e8f0',
              fontFamily: 'Newsreader,serif',
              fontStyle: 'italic',
              fontSize: 15,
            }}
          />
          <div onClick={onRun} role="button" style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 13.5, color: '#e7548a', cursor: 'pointer', flex: 'none' }}>
            reshape →
          </div>
        </div>
        <div style={{ marginTop: 13, fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#c4a0b2', lineHeight: 1.5 }}>{reply}</div>
      </div>
    </div>
  )
}
