/* Immersive homepage — replaces the previous LandingNativePage at "/".
 * Keeps the existing SpillModal / ScanModal flows and their hash + resume
 * bridge exactly as they behaved on the old landing (ported below), so
 * spill / scan / #ask / #mirror deep links still work the same way. */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@/compat/router'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { SpillModal } from '@/pages/landing/modals/SpillModal'
import { ScanModal } from '@/pages/landing/modals/ScanModal'
import { CompanionComposer } from '@/components/CompanionComposer'
import { saveSituation } from '@/lib/situations.functions'
import { requireRealUser, saveIntent } from '@/lib/auth-guard'
import { supabase } from '@/integrations/supabase/client'
import { SHUTAP_SEED } from '@/data/seed'
import { HeroMascot, usePrefersReducedMotion } from './hero/Mascot'
import { Chapter01Interview } from './chapters/Chapter01Interview'
import { Chapter02Scan } from './chapters/Chapter02Scan'
import { Chapter03Mirror } from './chapters/Chapter03Mirror'
import { RoomsStrip } from './RoomsStrip'
import { HomeFAQ } from './HomeFAQ'
import { Link } from '@tanstack/react-router'
import { Words } from '@/components/motion'
import './home.css'

const SORA = "'Sora',system-ui,sans-serif"
const NEWS = "'Newsreader',Georgia,serif"

// Bridge constants — kept identical to LandingPage so a spill saved from
// the old bridge and resumed here uses the same synced-key namespace.
const SYNCED_KEY = 'shutap_situations_synced'
function pillarMap(p?: string | null): 'relationships' | 'marriage' | 'family' | 'career' {
  if (p === 'family') return 'family'
  if (p === 'marriage') return 'marriage'
  if (p === 'career' || p === 'work') return 'career'
  return 'relationships'
}
function hashKey(input: { pillar?: string | null; title?: string | null; body?: string | null; clean_text?: string | null }): string {
  const norm = (s: unknown) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 240)
  const raw = pillarMap(input.pillar) + '|' + norm(input.title) + '|' + norm(input.body || input.clean_text)
  let h = 5381
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export function HomePage() {
  const navigate = useNavigate()
  const router = useRouter()
  const save = useServerFn(saveSituation)
  const reduce = usePrefersReducedMotion()

  const [spillOpen, setSpillOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [pendingCta, setPendingCta] = useState<null | 'spill' | 'scan'>(null)
  const [wordsIn, setWordsIn] = useState(reduce)

  // Live count: rooms currently open (seed + user-published)
  const [openCount, setOpenCount] = useState<number>(SHUTAP_SEED.rooms?.length ?? 0)
  useEffect(() => {
    const compute = () => {
      let user = 0
      try {
        const raw = localStorage.getItem('shutap_user_situations')
        if (raw) user = (JSON.parse(raw) as unknown[])?.length ?? 0
      } catch { /* noop */ }
      setOpenCount((SHUTAP_SEED.rooms?.length ?? 0) + user)
    }
    compute()
    const on = (e: StorageEvent) => { if (e.key === 'shutap_user_situations') compute() }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])

  useEffect(() => {
    // scroll-snap on <html>
    const el = document.documentElement
    el.classList.add('home-scroll-snap')
    return () => el.classList.remove('home-scroll-snap')
  }, [])

  useEffect(() => {
    if (reduce) return
    // trigger word reveal after mount
    const t = window.setTimeout(() => setWordsIn(true), 50)
    return () => window.clearTimeout(t)
  }, [reduce])

  useEffect(() => {
    void router.preloadRoute({ to: '/welcome' }).catch(() => {})
  }, [router])

  const preloadWelcome = useCallback(() => {
    void router.preloadRoute({ to: '/welcome' }).catch(() => {})
  }, [router])

  const openSpill = useCallback(async () => {
    setPendingCta('spill')
    try {
      if (!(await requireRealUser({ kind: 'spill' }))) return
      setSpillOpen(true)
    } finally { setPendingCta(null) }
  }, [])
  const closeSpill = useCallback(() => setSpillOpen(false), [])
  const openScan = useCallback(async () => {
    setPendingCta('scan')
    try {
      if (!(await requireRealUser({ kind: 'scan' }))) return
      setScanOpen(true)
    } finally { setPendingCta(null) }
  }, [])
  const closeScan = useCallback(() => setScanOpen(false), [])

  // Hash intents — /#spill, /#scan, /#ask, /#mirror (ported verbatim).
  useEffect(() => {
    const handle = async () => {
      const h = window.location.hash
      if (!h) return
      if (h === '#mirror') { history.replaceState(null, '', window.location.pathname + window.location.search); navigate('/mirror'); return }
      if (h === '#ask') {
        history.replaceState(null, '', window.location.pathname + window.location.search)
        setComposerOpen(true); return
      }
      if (h !== '#spill' && h !== '#scan') return
      const { data: sess } = await supabase.auth.getSession()
      const u = sess.session?.user as { is_anonymous?: boolean } | undefined
      const real = !!sess.session && !u?.is_anonymous
      history.replaceState(null, '', window.location.pathname + window.location.search)
      if (!real) {
        saveIntent(h === '#scan' ? { kind: 'scan' } : { kind: 'spill' })
        window.location.assign('/welcome')
        return
      }
      if (h === '#scan') setScanOpen(true); else setSpillOpen(true)
    }
    void handle()
    const onHash = () => { void handle() }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [navigate])

  // Resume pending spill after sign-in (ported verbatim).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const raw = sessionStorage.getItem('shutap_pending_save')
      if (!raw) return
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session || cancelled) return
      try {
        const payload = JSON.parse(raw) as { id?: string; pillar?: string | null; title?: string | null; body?: string | null; clean_text?: string | null }
        const normalized = { ...payload, pillar: pillarMap(payload.pillar) }
        const res = await save({ data: normalized as never })
        try {
          const cur = sessionStorage.getItem(SYNCED_KEY)
          const synced = cur ? (JSON.parse(cur) as Record<string, string>) : {}
          const h = hashKey({ pillar: payload.pillar, title: payload.title, body: payload.body || payload.clean_text })
          synced['hash:' + h] = res?.id || '1'
          if (payload.id) synced['bundle:' + payload.id] = res?.id || '1'
          sessionStorage.setItem(SYNCED_KEY, JSON.stringify(synced))
        } catch { /* ignore */ }
        sessionStorage.removeItem('shutap_pending_save')
        if (res?.room_id) {
          try {
            const { appendUserRoom } = await import('@/pages/landing/modals/SpillModal')
            appendUserRoom({
              id: res.room_id,
              title: payload.title ?? 'your situation',
              body: (payload.body ?? payload.clean_text ?? '') as string,
              support: 'heard',
              pillar: (normalized.pillar ?? null) as string | null,
            })
          } catch { /* noop */ }
          navigate(`/stream#room-${res.room_id}`)
        } else if (res?.id) navigate('/profile')
      } catch { /* leave payload for retry */ }
    })()
    return () => { cancelled = true }
  }, [navigate, save])

  const heroWordSize = 'clamp(36px, min(7vw,9.5vh), 96px)'

  return (
    <div style={{ background: '#fdf0f5', color: '#0b080f', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <main>
        {/* HERO */}
        <section
          className="home-chapter"
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 22px 40px', position: 'relative', textAlign: 'center' }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <HeroMascot size={220} />

            <h1
              style={{
                fontFamily: SORA,
                fontWeight: 800,
                fontSize: heroWordSize,
                lineHeight: 1,
                letterSpacing: '-.045em',
                margin: '18px 0 0',
                color: '#0b080f',
              }}
            >
              <span style={{ display: 'block' }}>
                {HERO_WORDS_LINE_1.map((w, i) => (
                  <HeroWord key={i} text={w} shown={wordsIn} delay={i * 80} space={i < HERO_WORDS_LINE_1.length - 1} />
                ))}
              </span>
              <span style={{ display: 'block', fontFamily: NEWS, fontStyle: 'italic', fontWeight: 400, background: 'linear-gradient(92deg,#e7548a,#890041 70%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                {HERO_WORDS_LINE_2.map((w, i) => (
                  <HeroWord key={i} text={w} shown={wordsIn} delay={(HERO_WORDS_LINE_1.length + i) * 80} space={i < HERO_WORDS_LINE_2.length - 1} />
                ))}
              </span>
            </h1>

            <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 19, color: '#4a3040', lineHeight: 1.55, maxWidth: '44ch', margin: '4px 0 0' }}>
              venting is free therapy — and you're not the only one who's been through this. spill it; someone in here has lived your exact thing.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
              <button
                type="button"
                onClick={openSpill}
                onPointerEnter={preloadWelcome}
                onFocus={preloadWelcome}
                disabled={pendingCta === 'spill'}
                style={{ background: 'linear-gradient(155deg,#ff7eb3,#e7548a 55%,#c1216b)', color: '#fff', border: 0, padding: '15px 26px', borderRadius: 999, fontFamily: SORA, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 12px 28px -12px rgba(193,33,107,.55)', letterSpacing: '-.005em' }}
              >
                {pendingCta === 'spill' ? 'opening…' : 'spill it →'}
              </button>
              <Link
                to="/stream"
                style={{ background: '#fff', color: '#0b080f', border: '1px solid rgba(11,8,15,.1)', padding: '15px 26px', borderRadius: 999, fontFamily: SORA, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '-.005em' }}
              >
                sit in a room
              </Link>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 6, fontFamily: SORA, fontWeight: 600, fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase', color: '#c1216b' }}>
              <span className="home-livedot" />
              {openCount > 0 ? `${openCount} rooms open now` : 'rooms are forming'}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 12, color: '#9e7a8c' }}>scroll</span>
            <span className="home-scrollline" />
          </div>
        </section>

        <Chapter01Interview onCtaSpill={openSpill} />
        <Chapter02Scan onCtaScan={openScan} />
        <Chapter03Mirror />

        <RoomsStrip />

        <HomeFAQ onOpenSpill={openSpill} onOpenScan={openScan} />

        {/* Finale */}
        <section
          className="home-chapter"
          style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '96px 22px', textAlign: 'center' }}
        >
          <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
            <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 18, color: '#9e7a8c' }}>ready when you are.</div>
            <h2 style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(44px,8vw,110px)', letterSpacing: '-.04em', lineHeight: 1, margin: 0 }}>
              say it <em style={{ fontFamily: NEWS, fontStyle: 'italic', fontWeight: 400, background: 'linear-gradient(92deg,#e7548a,#890041 70%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>here.</em>
            </h2>
            <button
              type="button"
              onClick={openSpill}
              style={{ background: 'linear-gradient(155deg,#ff7eb3,#e7548a 55%,#c1216b)', color: '#fff', border: 0, padding: '16px 32px', borderRadius: 999, fontFamily: SORA, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              join shutap →
            </button>
          </div>
        </section>

        <HomeFooter />
      </main>

      <SpillModal open={spillOpen} onClose={closeSpill} />
      <ScanModal open={scanOpen} onClose={closeScan} />
      <CompanionComposer open={composerOpen} onClose={() => setComposerOpen(false)} onSpill={openSpill} onScan={openScan} />
    </div>
  )
}

function HeroWord({ text, shown, delay, space }: { text: string; shown: boolean; delay: number; space: boolean }) {
  return (
    <span className="home-word-wrap" style={{ marginRight: space ? '0.28em' : 0 }}>
      <span
        className={`home-word${shown ? ' in' : ''}`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {text}
      </span>
    </span>
  )
}

export function HomeFooter() {
  return (
    <footer style={{ background: '#fdf0f5', borderTop: '.5px solid rgba(11,8,15,.06)', padding: '54px 22px 46px', color: '#6b4a5c', fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
        <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 16, color: '#4a3040' }}>
          shutap — a room for what you're carrying.
        </div>
        <div style={{ display: 'inline-flex', gap: 14, fontFamily: SORA, fontWeight: 600, fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase' }}>
          <Link to="/stream" style={{ color: '#6b4a5c', textDecoration: 'none' }}>rooms</Link>
          <Link to="/halls" style={{ color: '#6b4a5c', textDecoration: 'none' }}>halls</Link>
          <Link to="/vent/family" style={{ color: '#6b4a5c', textDecoration: 'none' }}>topics</Link>
        </div>
        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', fontFamily: 'Inter', fontSize: 12, color: '#9e7a8c' }}>
          <Link to="/terms" style={{ color: '#9e7a8c', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ color: '#9e7a8c', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/guidelines" style={{ color: '#9e7a8c', textDecoration: 'none' }}>Guidelines</Link>
          <Link to="/safety" style={{ color: '#9e7a8c', textDecoration: 'none' }}>Safety</Link>
          <Link to="/ai-disclosure" style={{ color: '#9e7a8c', textDecoration: 'none' }}>AI Disclosure</Link>
          <Link to="/legal" style={{ color: '#9e7a8c', textDecoration: 'none' }}>Disclaimer</Link>
          <a href="mailto:hello@shutap.com" style={{ color: '#9e7a8c', textDecoration: 'none' }}>Contact</a>
        </div>
        <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 13, color: '#9e7a8c', maxWidth: 620, lineHeight: 1.6 }}>
          18+ · pseudonymous · your real name never shows · your story, your rules 🤍
          <br />
          shutap is your group chat, not your therapist — not a medical or legal service. in an emergency, call or text 988 (US).
        </div>
        <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 10, letterSpacing: '.28em', color: '#c1216b', marginTop: 6 }}>
          YOU DON'T HAVE TO SHUT UP HERE
        </div>
      </div>
    </footer>
  )
}
