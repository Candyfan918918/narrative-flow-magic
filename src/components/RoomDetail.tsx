import { useEffect, useRef, useState } from 'react'
import type { Room } from '../data/types'
import { REACTIONS } from '../data/constants'
import { complete, extractJSON } from '../lib/ai'
import { eyeSVG } from './EyeDefs'

const badgeStyle = (support: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  background: support === 'heard' ? 'rgba(231,84,138,.08)' : 'rgba(91,138,94,.10)',
  color: support === 'heard' ? '#c1216b' : '#3a6b3c',
  border: '.5px solid ' + (support === 'heard' ? 'rgba(193,33,107,.18)' : 'rgba(91,138,94,.22)'),
  borderRadius: 999,
  padding: '5px 12px',
  fontFamily: 'Sora,sans-serif',
  fontWeight: 600,
  fontSize: 10.5,
  letterSpacing: '.05em',
})

interface Guide {
  guide: string
  starters: string[]
}

function guideFallback(r: Room): Guide {
  const heard = r.support === 'heard'
  const byHall: Record<string, Guide> = {
    love: { guide: "this one's about love and the mess it leaves. what did it stir in you?", starters: ["i've been here too…", 'reading this, i felt…', 'the part that got me…'] },
    family: { guide: 'family stories cut deep. say the thing this brings up — gently.', starters: ['in my family…', "what i'd want to hear…", 'this reminds me…'] },
    work: { guide: 'they put something at risk here. tell them how it lands.', starters: ['i did something like this…', 'honestly, i think…', 'what helped me…'] },
    home: { guide: 'small stakes, big feelings. vent it however it comes out.', starters: ["i'd have…", 'the part i sat with…', 'i once…'] },
  }
  return (
    byHall[r.hall] || {
      guide: heard ? 'they asked just to be heard. how does this land with you?' : "they're open to advice — but start with what you felt.",
      starters: heard ? ["i've been exactly here…", 'reading this, i felt…', 'the part that got me…'] : ['if it were me…', "one thing i'd say…", 'what helped me…'],
    }
  )
}

/* Full-screen room detail (the #room-<id> page). Reactions, presence seats,
   companion reflection, relate/add-your-side/share, and an AI-guided comment
   composer — faithful to Stream.dc.html's openRoomPage(). */
export function RoomDetail({
  room,
  onBack,
  toast,
}: {
  room: Room
  onBack: () => void
  toast: (m: string) => void
}) {
  const [active, setActive] = useState<Set<string>>(new Set())
  const [related, setRelated] = useState(false)
  const [guide, setGuide] = useState<string | null>(null)
  const [chips, setChips] = useState<string[]>([])
  const [helpText, setHelpText] = useState('seen without your real name.')
  const cmtRef = useRef<HTMLTextAreaElement>(null)
  const helpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const n = Math.min(room.sitting, 16)
  const seatGlyphs = ['🌸', '✦', '○', '·', '◦']

  // ── companion-offered "not alone" share at the resonance peak (§22 T4) ──
  const offerShare = () => {
    const count = (room.relates || 0) + 1
    if (!window.ShutapShare) return
    window.ShutapShare.offer('T4', {
      valence: 'positive',
      kind: 'relate',
      big: '+' + count,
      headline: 'i wasn’t the only one.',
      companion:
        'you’re not the only one — ' + count + ' people have been exactly here. want to show that someone else isn’t alone either?',
      caption: 'turns out i wasn’t the only one. ' + count + ' people have been here too 🤍 you’re not alone either →',
      loopLabel: 'you’re not alone either →',
      url: 'https://shutap.com/room/' + room.id,
      privacy: 'only the resonance leaves — never the story or any name.',
    })
  }

  const shareRoom = () => {
    if (!window.ShutapShare) return
    window.ShutapShare.manual({
      trigger: 'manual_room',
      kind: 'generic',
      headline: '“' + room.title + '”',
      companion: 'sharing this room — de-identified. only the headline and a link travel, never the full story.',
      caption: '“' + room.title + '” — a room on Shutap. someone in here has lived your exact thing →',
      url: 'https://shutap.com/room/' + room.id,
      loopLabel: 'take yours →',
      privacy: 'only the headline + link leave — never the full story.',
    })
  }

  // ── AI-guided comment nudge + starters (with deterministic fallback) ──
  useEffect(() => {
    let cancelled = false
    setGuide(null)
    setChips([])
    ;(async () => {
      let res: Guide
      try {
        const prompt =
          'You are the companion on Shutap — warm, perceptive, never clinical. A room is open on this story (teller ' +
          (room.support === 'heard' ? 'asked just to be heard, no advice' : 'is open to advice') +
          '):\n"' +
          room.title +
          '"\n' +
          room.body.slice(0, 280) +
          '\n\nWrite a SHORT guiding nudge (one sentence, lowercase) inviting people to vent/respond in a way that fits this specific story. Then 3 first-person opener phrases (3-6 words each, lowercase, ending with …) that someone could tap to start their comment about THIS story.\n\nReturn STRICT JSON: {"guide":"…","starters":["…","…","…"]}'
        const raw = await complete({ messages: [{ role: 'user', content: prompt }] })
        res = extractJSON<Guide>(raw)
        if (!res || !res.guide) res = guideFallback(room)
      } catch {
        res = guideFallback(room)
      }
      if (cancelled) return
      setGuide(res.guide)
      setChips((res.starters || []).slice(0, 3))
    })()
    return () => {
      cancelled = true
    }
  }, [room])

  // ── room structured data (SEO) + page title ──
  useEffect(() => {
    try {
      let s = document.getElementById('_roomld') as HTMLScriptElement | null
      if (!s) {
        s = document.createElement('script')
        s.type = 'application/ld+json'
        s.id = '_roomld'
        document.head.appendChild(s)
      }
      const top = (room.comments && room.comments[0]) || null
      const ld: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'DiscussionForumPosting',
        headline: room.title,
        articleBody: room.body,
        author: { '@type': 'Person', name: room.alias, description: 'pseudonymous member of Shutap' },
        interactionStatistic: [
          { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: room.relates },
          { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: room.comments ? room.comments.length : 0 },
        ],
        isPartOf: { '@type': 'WebSite', name: 'Shutap', url: 'https://shutap.com/' },
      }
      if (top) ld.comment = [{ '@type': 'Comment', text: top.text, author: { '@type': 'Person', name: top.alias } }]
      s.textContent = JSON.stringify(ld)
      const prev = document.title
      document.title = room.title.replace(/\.$/, '') + ' — a room on Shutap'
      return () => {
        document.title = prev
      }
    } catch {
      /* noop */
    }
  }, [room])

  const autosize = () => {
    const t = cmtRef.current
    if (!t) return
    t.style.height = 'auto'
    t.style.height = Math.min(160, t.scrollHeight) + 'px'
  }

  const submitComment = () => {
    const t = cmtRef.current
    if (t && t.value.trim()) {
      setHelpText('offered. the room felt that.')
      if (helpTimer.current) clearTimeout(helpTimer.current)
      helpTimer.current = setTimeout(() => setHelpText('seen without your real name.'), 3200)
      toast('🤍 offered to the room.')
      t.value = ''
      t.style.height = 'auto'
    }
  }

  const bars = REACTIONS.map((rx) => (
    <span key={rx.k} style={{ flex: room.reactions[rx.k], background: rx.color }} />
  ))

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#fdf0f5', overflowY: 'auto' }}
    >
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 22px 90px' }}>
        <div
          role="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: 'Newsreader,serif',
            fontStyle: 'italic',
            fontSize: 13.5,
            color: '#6b4a5c',
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >
          ← back to rooms
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={badgeStyle(room.support)}>{room.support === 'heard' ? 'looking to be heard' : 'open to advice'}</span>
          <span style={{ fontSize: 12.5, color: '#9e7a8c', fontFamily: 'Newsreader,serif', fontStyle: 'italic' }}>{room.hours} ago</span>
        </div>

        <h2
          style={{
            fontFamily: 'Sora,sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(20px,4vw,26px)',
            lineHeight: 1.2,
            margin: '0 0 14px',
            color: '#0b080f',
            letterSpacing: '-.01em',
          }}
        >
          {room.title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#f7e8f0', display: 'grid', placeItems: 'center', fontSize: 16, flex: 'none' }}>
            {room.emoji}
          </span>
          <span style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#6b4a5c' }}>{room.alias}</span>
        </div>

        <p style={{ fontFamily: 'Newsreader,serif', fontSize: 17, lineHeight: 1.65, color: '#2e1a26', margin: '0 0 26px', whiteSpace: 'pre-line' }}>
          {room.body}
        </p>

        {/* companion reflection */}
        <div
          style={{
            background: 'linear-gradient(160deg,#2e0d1a,#1a0a12)',
            borderRadius: 16,
            padding: '18px 20px',
            marginBottom: 26,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: eyeSVG(22, 16) }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#f7b8d4', marginBottom: 6 }}>
              companion
            </div>
            <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15, lineHeight: 1.55, color: '#f7e8f0' }}>{room.reflection}</div>
          </div>
        </div>

        {/* presence */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5DCAA5', animation: 'breathe 2.8s ease-in-out infinite', display: 'block' }} />
            <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6b4a5c' }}>
              {room.sitting} sitting in right now
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {Array.from({ length: n }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,rgba(231,84,138,.15),rgba(193,33,107,.25))',
                  border: '.5px solid rgba(231,84,138,.2)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 15,
                  animation: `breathe ${2.4 + i * 0.18}s ease-in-out infinite`,
                }}
              >
                {seatGlyphs[i % 5]}
              </span>
            ))}
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'auto',
                padding: '0 10px',
                height: 28,
                borderRadius: 14,
                background: '#f7e8f0',
                fontFamily: 'Newsreader,serif',
                fontStyle: 'italic',
                fontSize: 12,
                color: '#9e7a8c',
              }}
            >
              and {room.sitting - n} more
            </span>
          </div>
        </div>

        {/* reactions */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c', marginBottom: 9 }}>
            how the room is holding this
          </div>
          <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 13 }}>{bars}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {REACTIONS.map((rx) => {
              const isActive = active.has(rx.k)
              return (
                <button
                  key={rx.k}
                  className={'react-btn' + (isActive ? ' active' : '')}
                  style={{ color: rx.color }}
                  onClick={() => {
                    setActive((prev) => {
                      const next = new Set(prev)
                      if (next.has(rx.k)) next.delete(rx.k)
                      else next.add(rx.k)
                      return next
                    })
                    const nowActive = !isActive
                    toast(nowActive ? 'reaction added.' : 'reaction withdrawn.')
                    if (nowActive) offerShare()
                  }}
                >
                  <span>{rx.emoji}</span>
                  <span>{rx.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* relate / side / share */}
        <div
          style={{
            borderTop: '.5px solid rgba(11,8,15,.08)',
            paddingTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <button
              onClick={() => {
                setRelated(true)
                toast("added. the room knows you're there.")
                offerShare()
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 18px',
                borderRadius: 999,
                border: '1.5px solid ' + (related ? '#c1216b' : 'rgba(11,8,15,.12)'),
                background: related ? '#fdf0f5' : '#fff',
                cursor: 'pointer',
                fontFamily: 'Newsreader,serif',
                fontStyle: 'italic',
                fontSize: 14.5,
                color: '#4a3040',
                transition: '.18s',
              }}
            >
              🫂 omg same{' '}
              <b style={{ fontStyle: 'normal', fontFamily: 'Inter', fontWeight: 600, color: '#c1216b' }}>{room.relates}</b>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              role="button"
              onClick={() => toast('add-your-side coming soon.')}
              style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#6b4a5c', cursor: 'pointer' }}
            >
              add your side →
            </span>
            <span
              role="button"
              title="share this room"
              onClick={shareRoom}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 14, color: '#c1216b', cursor: 'pointer' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#c1216b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
              </svg>
              share
            </span>
          </div>
        </div>

        {/* comments */}
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: '.5px solid rgba(11,8,15,.08)' }}>
          <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginBottom: 14 }}>
            <svg viewBox="0 0 56 56" fill="none" style={{ display: 'block', width: 24, height: 24, flex: 'none', marginTop: 2 }}>
              <circle cx="28" cy="28" r="27" fill="#fdf0f5" />
              <rect x="15.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
              <rect x="29.25" y="16" width="11.5" height="24" rx="5.75" fill="url(#eyeG)" />
              <ellipse cx="21" cy="29" rx="4" ry="5" fill="url(#pupG)" />
              <ellipse cx="35" cy="29" rx="4" ry="5" fill="url(#pupG)" />
            </svg>
            <div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#c1216b', marginBottom: 5 }}>
                companion
              </div>
              <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15.5, lineHeight: 1.5, color: '#0b080f' }}>
                {guide === null ? (
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s infinite' }} />
                    <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s .2s infinite' }} />
                    <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#e7548a', display: 'block', animation: 'blinkdot 1.2s .4s infinite' }} />
                  </span>
                ) : (
                  guide
                )}
              </div>
            </div>
          </div>

          <div style={{ marginLeft: 35 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 11 }}>
              {chips.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const t = cmtRef.current
                    if (t) {
                      t.value = s + ' '
                      t.focus()
                      autosize()
                    }
                  }}
                  onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#fdf0f5')}
                  onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#fff')}
                  style={{
                    background: '#fff',
                    border: '1px solid rgba(231,84,138,.3)',
                    borderRadius: 999,
                    padding: '7px 13px',
                    cursor: 'pointer',
                    fontFamily: 'Newsreader,serif',
                    fontStyle: 'italic',
                    fontSize: 12.5,
                    color: '#c1216b',
                    transition: '.15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <CommentField cmtRef={cmtRef} autosize={autosize} onSend={submitComment} />

            <div style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 12.5, color: '#9e7a8c', marginTop: 8 }}>{helpText}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentField({
  cmtRef,
  autosize,
  onSend,
}: {
  cmtRef: React.RefObject<HTMLTextAreaElement | null>
  autosize: () => void
  onSend: () => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 9,
        background: '#fff',
        border: '1px solid ' + (focused ? '#e7548a' : 'rgba(11,8,15,.10)'),
        borderRadius: 14,
        padding: '13px 15px',
        transition: 'border-color .18s',
      }}
    >
      <textarea
        ref={cmtRef}
        rows={2}
        placeholder="vent here — it doesn't have to be advice. say how it lands for you…"
        onInput={autosize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
          }
        }}
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          outline: 'none',
          color: '#0b080f',
          fontFamily: 'Newsreader,serif',
          fontStyle: 'italic',
          fontSize: 15,
          resize: 'none',
          maxHeight: 160,
          lineHeight: 1.5,
        }}
      />
      <div
        role="button"
        onClick={onSend}
        style={{
          fontFamily: 'Sora,sans-serif',
          fontWeight: 700,
          fontSize: 12,
          color: '#fff',
          background: '#e7548a',
          borderRadius: 999,
          padding: '7px 14px',
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        offer it →
      </div>
    </div>
  )
}
