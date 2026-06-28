/* Reactive Landing — replaces the iframe port. Real React with Spill + Scan
 * triggers, Mirror card, and recent public rooms preview. */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { Header } from '@/components/Header'
import { SpillSheet } from '@/components/spill/SpillSheet'
import { ScanFlow } from '@/components/scan/ScanFlow'
import { listMySituations, saveSituation } from '@/lib/situations.functions'
import { supabase } from '@/integrations/supabase/client'
import { track } from '@/lib/behavioral'
import { getAlias } from '@/lib/auth'

const PINK = '#c1216b'
const INDIGO = '#7F77DD'

export function LandingPage() {
  const navigate = useNavigate()
  const [spillOpen, setSpillOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const callSave = useServerFn(saveSituation)
  const callList = useServerFn(listMySituations)

  // resume pending save after sign-in
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const raw = sessionStorage.getItem('shutap_pending_save')
      if (!raw) return
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session || cancelled) return
      try {
        const payload = JSON.parse(raw)
        const res = await callSave({ data: payload as never })
        sessionStorage.removeItem('shutap_pending_save')
        if (payload.is_public && res.room_id) navigate(`/room?id=${res.id}`)
        else navigate('/profile')
      } catch { /* leave for retry */ }
    })()
    return () => { cancelled = true }
  }, [navigate, callSave])

  const [authed, setAuthed] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (authed) track('session_start', { page: 'landing' }) }, [authed])

  const alias = getAlias()
  const { data: mine } = useQuery({
    queryKey: ['my-situations-preview'],
    queryFn: () => callList(),
    enabled: authed && !!alias,
    staleTime: 60000,
  })
  const myCount = mine?.length ?? 0
  const mirrorReady = myCount >= 2

  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header />
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '34px 22px 80px' }}>
        <h1 style={hero}>
          relationships, marriage, family, work.<br />
          <em>say what's actually happening.</em>
        </h1>
        <p style={subhero}>warm, anonymous, on your side. spill out loud or scan how loud it is in your head.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 28 }}>
          <button onClick={() => setSpillOpen(true)} style={{ ...cta, background: PINK }}>
            <div style={ctaLabel}>SPILL ✦</div>
            <div style={ctaCopy}>tell the spill what's up — i'll dig with you, then write it up in your voice.</div>
          </button>
          <button onClick={() => setScanOpen(true)} style={{ ...cta, background: INDIGO }}>
            <div style={ctaLabel}>SCAN ✦</div>
            <div style={ctaCopy}>9–12 quick cards. i'll read how loud it is right now and give you a real number.</div>
          </button>
        </div>

        {/* mirror card — proactive surface (§9, §10) */}
        <Link to="/mirror" onClick={() => track('mirror_card_open')} style={mirrorCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '.18em', color: INDIGO }}>THE MIRROR ✦</div>
            <span style={{ color: INDIGO, fontSize: 12 }}>open →</span>
          </div>
          <p style={mirrorLine}>
            {mirrorReady
              ? 'a living portrait of you — drawn from what you have actually said.'
              : 'still forming. spill once or twice and i will start to see you clearly.'}
          </p>
        </Link>

        <div style={{ marginTop: 36 }}>
          <Link to="/stream" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '.16em', color: '#9e7a8c' }}>
              ROOMS · the public stream
            </div>
            <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 17, color: '#0b080f', marginTop: 6 }}>
              wander what other people are pouring out today →
            </p>
          </Link>
        </div>
      </main>

      <SpillSheet open={spillOpen} onClose={() => setSpillOpen(false)} />
      <ScanFlow open={scanOpen} onClose={() => setScanOpen(false)} />
    </div>
  )
}

const hero: React.CSSProperties = { fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 30, lineHeight: 1.18, margin: 0, color: '#0b080f' }
const subhero: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 17, color: '#4a3040', marginTop: 12 }
const cta: React.CSSProperties = { display: 'block', textAlign: 'left', padding: '18px 20px', borderRadius: 18, border: 0, color: '#fff', cursor: 'pointer', minHeight: 130 }
const ctaLabel: React.CSSProperties = { fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '.16em', marginBottom: 8 }
const ctaCopy: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 15, lineHeight: 1.35, opacity: .94 }
const mirrorCard: React.CSSProperties = { display: 'block', marginTop: 22, padding: '18px 20px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(127,119,221,.10), rgba(193,33,107,.06))', border: '.5px solid rgba(127,119,221,.25)', textDecoration: 'none' }
const mirrorLine: React.CSSProperties = { fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 16, color: '#0b080f', marginTop: 8 }
