/* The joke-card surface: hero → open box → the set → set list → paywall.
 * Renders on `/` and on `/mirror`. Every rule (tier, flip allowance, card
 * text) is resolved server-side; this component only draws it. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { supabase } from '@/integrations/supabase/client'
import {
  submitJokeEntry,
  flipJokeCard,
  claimJokeSession,
  listMyJokeCards,
  postJokeCardToRoom,
} from '@/lib/jokes.functions'
import { ANGLE_LABEL, ARCHETYPE_LABEL, ROMAN, fitSize, type JokeCard, type JokeTier } from '@/lib/jokes/deck'
import { anonSessionId, clearAnonSessionId, jokeTrack, downloadCardPng, cardImageUrl } from './jokeClient'
import { SignInSheet } from './SignInSheet'

const SORA = "'Sora',system-ui,sans-serif"
const NEWS = "'Newsreader',Georgia,serif"
const VIOLET = '#7F77DD'

type Pending =
  | { type: 'flip'; position: number }
  | { type: 'share' }
  | { type: 'download' }
  | { type: 'post' }
  | { type: 'keep' }
  | { type: 'checkout' }

type SetState = {
  id: string
  archetype: string
  angles: string[]
  cards: (JokeCard | null)[]
  loading: boolean[]
}

export function JokeSurface() {
  const navigate = useNavigate()
  const submit = useServerFn(submitJokeEntry)
  const flip = useServerFn(flipJokeCard)
  const claim = useServerFn(claimJokeSession)
  const listCards = useServerFn(listMyJokeCards)
  const postCard = useServerFn(postJokeCardToRoom)

  const [text, setText] = useState('')
  const [tier, setTier] = useState<JokeTier>('guest')
  const [archetype, setArchetype] = useState<string>('')
  const [crisis, setCrisis] = useState(false)
  const [set, setSet] = useState<SetState | null>(null)
  const [guestCard, setGuestCard] = useState<JokeCard | null>(null)
  const [openCard, setOpenCard] = useState<JokeCard | null>(null)
  const [postedAlias, setPostedAlias] = useState<string | null>(null)
  const [list, setList] = useState<JokeCard[]>([])
  const [flipsUsed, setFlipsUsed] = useState(0)
  const [setsFlipped, setSetsFlipped] = useState(0)
  const [refusal, setRefusal] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [sheet, setSheet] = useState<{ open: boolean; trigger: string }>({ open: false, trigger: 'keep' })
  const [busy, setBusy] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const pending = useRef<Pending | null>(null)
  const setRef = useRef<HTMLDivElement | null>(null)

  const signedIn = tier !== 'guest'
  const ctx = useCallback(
    // No timezone is sent: the server derives the day from stored state only.
    () => ({ anon_session_id: anonSessionId() }),
    [],
  )

  const say = useCallback((m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await listCards({ data: {} })
      setTier(res.tier)
      setList(res.cards)
    } catch { /* stay guest */ }
  }, [listCards])

  useEffect(() => { void refresh() }, [refresh])

  // Sign-in lands back on this page. Claim the guest session, then resume.
  const claimAndResume = useCallback(async () => {
    const held = guestCard && set
      ? {
          set_id: set.id,
          position: held_position(set, guestCard),
          angle: guestCard.angle,
          text: guestCard.text,
          used_fallback: guestCard.used_fallback,
          judge_score: guestCard.judge_score,
        }
      : null
    try {
      const p0 = pending.current
      const res = await claim({
        data: {
          ...ctx(),
          hold: held,
          resume_flip: p0?.type === 'flip' && set ? { set_id: set.id, position: p0.position } : null,
        },
      })
      setTier(res.tier)
      clearAnonSessionId()
      if (res.claimed) {
        jokeTrack('guest_card_claimed', res.tier)
        setGuestCard(null)
        setOpenCard(res.claimed)
        setSet((s) => (s ? { ...s, cards: s.cards.map((c, i) => (i === res.claimed!.position ? res.claimed : c)) } : s))
      }
      jokeTrack('signin_completed', res.tier)
      await refresh()
      say(res.alias ? `you're in. ${res.alias.emoji} ${res.alias.display_name}` : "you're in.")
      const p = pending.current
      pending.current = null
      if (p?.type === 'flip') void doFlip(p.position, true)
      else if (p?.type === 'share') void doShare()
      else if (p?.type === 'download') void doDownload()
      else if (p?.type === 'post') void doPost()
      else if (p?.type === 'checkout') void navigate({ to: '/subscribe' })
    } catch { /* leave them signed in without a claim */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim, ctx, guestCard, set, refresh, say, navigate])

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void claimAndResume()
    })
    return () => sub.subscription.unsubscribe()
  }, [claimAndResume])

  function raiseSheet(trigger: string, p: Pending) {
    pending.current = p
    setSheet({ open: true, trigger })
    jokeTrack('signin_sheet_shown', tier, { trigger })
  }

  // ── entry ──
  async function onSubmit() {
    const raw = text.trim()
    if (raw.length < 12) { say('give me a few more words and i will find the funny in it.'); return }
    setBusy(true)
    setRefusal(null)
    try {
      const res = await submit({ data: { raw, ...ctx() } })
      jokeTrack('entry_submitted', tier, { chars: raw.length })
      if (res.crisis) {
        setSet(null); setGuestCard(null); setArchetype(''); setCrisis(true)
        jokeTrack('crisis_route_shown', tier)
        return
      }
      setCrisis(false)
      setArchetype(res.archetype)
      setTier(res.tier)
      setSet({ id: res.set_id, archetype: res.archetype, angles: res.angles, cards: [null, null, null], loading: [false, false, false] })
      setGuestCard(null)
      jokeTrack('set_created', res.tier, { archetype: res.archetype, angles: res.angles.join(',') })
      requestAnimationFrame(() => {
        const el = setRef.current
        if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72), behavior: 'smooth' })
      })
    } catch {
      say('that did not go through. try again?')
    } finally {
      setBusy(false)
    }
  }

  // ── flip ──
  const doFlip = useCallback(async (position: number, _granted = false) => {
    const cur = set
    if (!cur || cur.cards[position] || cur.loading[position]) return
    setRefusal(null)
    setSet({ ...cur, loading: cur.loading.map((l, i) => (i === position ? true : l)) })
    try {
      const res = await flip({ data: { set_id: cur.id, position, ...ctx() } })
      if (!res.ok) {
        setSet({ ...cur, loading: [false, false, false] })
        jokeTrack('flip_refused', res.tier, { reason: res.reason, scope: res.scope, position })
        if (res.reason === 'rate_limited') {
          setRefusal('too many flips from this connection today. give it a bit.')
          return
        }
        if (res.tier === 'guest') { raiseSheet('second_flip', { type: 'flip', position }); return }
        setRefusal(
          res.scope === 'set'
            ? 'all three are open. that set is done.'
            : res.tier === 'paying'
              ? "three sets today. that's the lot — tomorrow the deck resets."
              : "that's your flip for today. the mirror reads all three, any day you like.",
        )
        return
      }
      setTier(res.tier)
      setFlipsUsed(res.flips_used)
      setSetsFlipped(res.sets_flipped)
      setSet((s) => (s ? { ...s, cards: s.cards.map((c, i) => (i === position ? res.card : c)), loading: [false, false, false] } : s))
      jokeTrack('card_flipped', res.tier, {
        angle: res.card.angle, position, used_fallback: res.card.used_fallback, judge_score: res.card.judge_score,
      })
      if (res.tier === 'guest') setGuestCard(res.card)
      else void refresh()
      setPostedAlias(null)
      setOpenCard(res.card)
    } catch {
      setSet((s) => (s ? { ...s, loading: [false, false, false] } : s))
      say('the deck jammed. try that flip again?')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, flip, ctx, refresh, say])

  // ── card actions ──
  async function doShare() {
    const card = openCard
    if (!card) return
    if (!card.id) { raiseSheet('share', { type: 'share' }); jokeTrack('share_blocked_signin', tier); return }
    const url = window.location.origin + cardImageUrl(card.id)
    try {
      if (navigator.share) await navigator.share({ text: card.text, url })
      else { await navigator.clipboard.writeText(`${card.text}\n${url}`); say('copied. paste it wherever.') }
      jokeTrack('share_completed', tier, { angle: card.angle })
    } catch { /* dismissed */ }
  }

  async function doDownload() {
    const card = openCard
    if (!card) return
    if (!card.id) { raiseSheet('download', { type: 'download' }); jokeTrack('download_blocked_signin', tier); return }
    try {
      await downloadCardPng(card.id)
      jokeTrack('download_completed', tier, { angle: card.angle })
    } catch { say('the image did not render. try once more?') }
  }

  async function doPost() {
    const card = openCard
    if (!card) return
    if (!card.id) { raiseSheet('post', { type: 'post' }); jokeTrack('post_blocked_signin', tier); return }
    try {
      const res = await postCard({ data: { card_id: card.id, ...ctx() } })
      setPostedAlias(res.alias ?? 'you')
      jokeTrack('card_posted_to_room', tier, { angle: card.angle })
      void refresh()
    } catch { say('could not open the room. try again?') }
  }

  function startCheckout() {
    if (!signedIn) { raiseSheet('checkout', { type: 'checkout' }); return }
    jokeTrack('checkout_started', tier, { lookup_key: 'mirror_monthly' })
    void navigate({ to: '/subscribe' })
  }

  const days = useMemo(() => new Set(list.map((c) => c.day).filter(Boolean)).size, [list])

  const flipsLabel = set
    ? tier === 'paying'
      ? `${3 - set.cards.filter(Boolean).length} of 3 left in this set · ${Math.max(0, 3 - setsFlipped)} sets left today`
      : flipsUsed >= 1
        ? 'flipped for today · back tomorrow'
        : 'one flip today — make it count'
    : ''

  const hint = text.trim().length === 0
    ? ''
    : text.trim().length < 30
      ? 'keep going — the specifics are what make it funny.'
      : 'that will do it.'

  return (
    <>
      {/* ══ 1 · hero + the open box ══ */}
      <section id="joke" style={{ position: 'relative', overflow: 'hidden', background: '#fff', padding: 'clamp(92px,12vh,132px) clamp(16px,4vw,28px) clamp(24px,4vh,44px)' }}>
        <div style={{ position: 'absolute', inset: '-40% -20% auto', height: '80vh', background: 'radial-gradient(ellipse at 50% 35%,rgba(127,119,221,.13),transparent 64%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(13px,2.2vh,20px)' }}>
          <div className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: '.24em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c1216b' }} />
            pseudonymous · no advice · different perspectives
          </div>
          <h1 style={{ fontFamily: SORA, fontWeight: 700, fontSize: 'clamp(38px,8.4vw,86px)', lineHeight: 1.02, letterSpacing: '-.05em', textAlign: 'center', margin: 0 }}>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              shut<span style={{ color: '#e7548a' }}>ap</span>.
              <span
                aria-hidden
                style={{
                  position: 'absolute', top: '-.16em', right: '.06em',
                  width: '.3em', height: '.3em', borderRadius: '50%',
                  border: '1px solid rgba(231,84,138,.55)',
                  display: 'grid', placeItems: 'center',
                }}
              >
                <span style={{ width: '.055em', height: '.055em', borderRadius: '50%', background: '#c1216b' }} />
              </span>
            </span>
            <br />
            <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-.02em', color: '#8e1c4c' }}>joke about it.</span>
          </h1>
          <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 'clamp(17px,2vw,22px)', lineHeight: 1.45, color: '#443c42', textAlign: 'center', maxWidth: '34ch', margin: 0 }}>
            life's a bitch. so make fun of it — you've still got the better sense of humour.
          </p>

          <div style={{ width: '100%', position: 'relative', background: '#fff', border: '1px solid rgba(231,84,138,.28)', borderRadius: 26, padding: 'clamp(16px,2.4vw,22px)', boxShadow: '0 28px 60px -38px rgba(35,26,32,.28)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="yeah — tell me about it."
              style={{ width: '100%', resize: 'vertical', minHeight: 116, border: 'none', outline: 'none', background: 'transparent', fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, lineHeight: 1.55, color: '#2b2429' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => void onSubmit()} disabled={busy} className="pill pill-wine" style={{ height: 42, opacity: busy ? 0.7 : 1 }}>
                {busy ? 'reading it…' : 'turn it into a joke →'}
              </button>
            </div>
          </div>

          {/* footnote row + hover-expand explainer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: SORA, fontSize: 12.5, color: '#8a7a84' }}>
              <span>{signedIn ? 'names scrubbed before anything saves' : 'no account · names scrubbed'}</span>
              <span aria-hidden>·</span>
              <span
                onMouseEnter={() => setHowOpen(true)}
                onMouseLeave={() => setHowOpen(false)}
                style={{ display: 'inline-flex' }}
              >
                <button
                  type="button"
                  aria-expanded={howOpen}
                  onClick={() => setHowOpen((v) => !v)}
                  onFocus={() => setHowOpen(true)}
                  onBlur={() => setHowOpen(false)}
                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: SORA, fontSize: 12.5, color: '#6b4a5c', textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  how it works
                </button>
              </span>
            </div>
            <div
              onMouseEnter={() => setHowOpen(true)}
              onMouseLeave={() => setHowOpen(false)}
              style={{
                maxWidth: 460,
                overflow: 'hidden',
                maxHeight: howOpen ? 220 : 0,
                opacity: howOpen ? 1 : 0,
                transform: howOpen ? 'none' : 'translateY(-4px)',
                transition: 'max-height .38s cubic-bezier(.2,.8,.2,1), opacity .28s, transform .28s',
              }}
            >
              <ol style={{ margin: 0, padding: '12px 18px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, background: 'rgba(127,119,221,.06)', border: '1px solid rgba(11,8,15,.07)', borderRadius: 18, fontFamily: NEWS, fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.5, color: '#443c42', textAlign: 'left' }}>
                <li><span style={{ color: '#8e1c4c' }}>i.</span> type what happened — names get scrubbed before anything saves.</li>
                <li><span style={{ color: '#8e1c4c' }}>ii.</span> we read the situation and deal you three angles, face down.</li>
                <li><span style={{ color: '#8e1c4c' }}>iii.</span> flip one. it roasts the situation, not you.</li>
              </ol>
            </div>
          </div>

          {hint ? (
            <div style={{ fontFamily: SORA, fontSize: 12.5, color: '#8a7a84' }}>{hint}</div>
          ) : null}

          {archetype && archetype !== 'general' && text.trim().length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: SORA, fontSize: 13, color: '#6b4a5c' }}>
              <span>✦ reading this as <strong style={{ color: '#8e1c4c', fontWeight: 600 }}>{ARCHETYPE_LABEL[archetype] ?? archetype}</strong></span>
              <button onClick={() => setArchetype('general')} style={{ cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline', fontFamily: SORA, fontSize: 13, color: '#8a7a84', padding: 0 }}>
                not right?
              </button>
            </div>
          ) : null}

        </div>
      </section>

      {/* ══ 2 · crisis — support register only ══ */}
      {crisis ? (
        <section style={{ background: '#fff', padding: '0 clamp(16px,4vw,28px) clamp(40px,7vh,80px)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', background: '#fff', border: '1px solid rgba(137,0,65,.35)', borderRadius: 22, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 19, color: '#890041' }}>no jokes for this one.</div>
            <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, lineHeight: 1.6, color: '#383136' }}>
              what you just wrote is heavier than a card can hold, and i'm not going to make a punchline out of it. talking to a person helps more than i can right now.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <a className="pill pill-dark" href="#support">support lines →</a>
              <a className="pill pill-ghost" href="#spill">say the long version instead</a>
            </div>
          </div>
        </section>
      ) : null}

      {/* ══ 3 · the set ══ */}
      {set ? (
        <section ref={setRef} style={{ background: 'linear-gradient(180deg,#fff,rgba(16,12,20,.04))', padding: 'clamp(16px,3vh,36px) clamp(16px,4vw,28px) clamp(36px,6vh,72px)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(14px,2.6vh,24px)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 'clamp(22px,3.2vw,32px)', letterSpacing: '-.03em' }}>your set</div>
                <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, color: '#6b4a5c' }}>three angles, drawn from seven. flip one and see what it does with it.</div>
              </div>
              <div className="eyebrow" style={{ letterSpacing: '.12em' }}>{flipsLabel}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'clamp(10px,1.8vw,18px)', maxWidth: 760, width: '100%', margin: '0 auto' }}>
              {set.angles.map((angle, i) => {
                const card = set.cards[i]
                const loading = set.loading[i]
                const revealed = !!card || loading
                return (
                  <div
                    key={angle + i}
                    onClick={() => { if (card) { setPostedAlias(null); setOpenCard(card) } else void doFlip(i) }}
                    style={{ position: 'relative', aspectRatio: '.68', perspective: 1200, cursor: 'pointer' }}
                  >
                    <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transition: 'transform .72s cubic-bezier(.2,.8,.2,1)', transform: `rotateY(${revealed ? 180 : 0}deg)` }}>
                      {/* face down */}
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 22, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 20%,rgba(127,119,221,.10),#fff 62%)', border: '1px solid rgba(11,8,15,.08)', boxShadow: '0 30px 60px -32px rgba(11,8,15,.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <div style={{ position: 'absolute', inset: 6, border: '.5px solid rgba(11,8,15,.08)', borderRadius: 16, pointerEvents: 'none' }} />
                        <div style={{ position: 'absolute', top: 0, left: '12%', right: '12%', height: 1.5, background: `linear-gradient(90deg,transparent,${VIOLET},#c1216b,#5B8A5E,transparent)`, opacity: 0.4 }} />
                        <span style={{ fontSize: 26 }}>👁️</span>
                        <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, color: VIOLET }}>tap to flip</span>
                      </div>
                      {/* face up */}
                      <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 22, overflow: 'hidden', background: 'radial-gradient(125% 80% at 50% 0%,rgba(127,119,221,.08),#fff 58%)', border: '1px solid rgba(11,8,15,.08)', boxShadow: '0 30px 60px -32px rgba(11,8,15,.22)', padding: '16px 15px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ position: 'absolute', inset: 6, border: '.5px solid rgba(11,8,15,.08)', borderRadius: 16, pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span className="eyebrow" style={{ color: VIOLET, fontSize: 9, letterSpacing: '.16em' }}>{ANGLE_LABEL[angle] ?? angle}</span>
                          <span style={{ fontFamily: NEWS, fontSize: 17, color: '#8e1c4c' }}>{ROMAN[i]}</span>
                        </div>
                        <span style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NEWS, fontStyle: 'italic', fontSize: `clamp(11px,3.3vw,${loading ? '19px' : fitSize(card?.text.length ?? 0)})`, lineHeight: 1.3, color: '#1b0f16', textAlign: 'center' }}>
                          {loading ? 'shuffling…' : card?.text}
                        </span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderTop: '.5px solid rgba(11,8,15,.08)', paddingTop: 9 }}>
                          <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 11, letterSpacing: '-.02em', color: '#1b0f16' }}>shut<span style={{ color: '#e7548a' }}>ap</span></span>
                          <span className="eyebrow" style={{ fontSize: 9, letterSpacing: '.22em', color: '#6b4a5c' }}>{loading ? 'forming' : 'open it'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {refusal ? (
              <div style={{ maxWidth: 760, margin: '0 auto', width: '100%', background: '#fff', border: '1px dashed rgba(142,28,76,.32)', borderRadius: 18, padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 16 }}>{refusal}</div>
                  <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 15, color: '#6b4a5c' }}>all three flip when the mirror is reading.</div>
                </div>
                <button className="pill pill-dark" onClick={startCheckout}>flip all three →</button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ══ 4 · set list + the one paywall block ══ */}
      {signedIn && list.length > 0 ? (
        <section style={{ background: 'rgba(16,12,20,.04)', padding: '0 clamp(16px,4vw,28px) clamp(36px,6vh,72px)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', paddingTop: 'clamp(24px,4vh,48px)' }}>
              <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 'clamp(20px,2.6vw,26px)', letterSpacing: '-.03em' }}>your set list</span>
              <span style={{ fontFamily: SORA, fontSize: 13, color: '#8a7a84' }}>
                🃏 {list.length} kept · {days <= 1 ? 'day one' : `${days} days of it`}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
              {list.slice(0, 30).map((c) => (
                <div
                  key={c.id}
                  onClick={() => { setPostedAlias(null); setOpenCard(c) }}
                  style={{ cursor: 'pointer', background: '#fff', border: '1px solid rgba(11,8,15,.08)', borderRadius: 22, padding: '18px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 160 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="eyebrow" style={{ fontSize: 9, letterSpacing: '.16em', color: VIOLET }}>{c.angleLabel}</span>
                    {c.room_id ? <span className="eyebrow" style={{ fontSize: 9, color: '#8e1c4c' }}>🃏 in a room</span> : null}
                  </div>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NEWS, fontStyle: 'italic', fontSize: fitSize(c.text.length), lineHeight: 1.3, color: '#1b0f16', textAlign: 'center' }}>
                    {c.text}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 6, background: 'radial-gradient(120% 120% at 10% 0%,rgba(127,119,221,.06),#fff 65%)', border: '1px solid rgba(11,8,15,.08)', borderRadius: 22, padding: 'clamp(20px,3vw,30px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
              <div style={{ maxWidth: '52ch' }}>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 'clamp(20px,2.6vw,26px)', letterSpacing: '-.03em', color: '#0b080f' }}>
                  {tier === 'paying' ? 'the mirror is reading all of it.' : 'there is a pattern across these you cannot see yet.'}
                </div>
                <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, lineHeight: 1.55, color: '#4a3040', marginTop: 6 }}>
                  {tier === 'paying'
                    ? `cross-read, districts, depth, trend and signal mix — now with 🃏 joke in the mix, across ${list.length} ${list.length === 1 ? 'card' : 'cards'}.`
                    : list.length >= 2
                      ? `you have kept ${list.length} cards over ${days} ${days === 1 ? 'day' : 'days'}. the mirror reads them at once — which behaviour keeps showing up, and how the jokes changed as you did.`
                      : 'the mirror reads your whole set list at once — which behaviour keeps showing up, who it keeps being, and how the jokes changed as you did.'}
                </p>
              </div>
              <button
                className="pill pill-wine"
                style={{ height: 46, padding: '0 26px', fontSize: 15 }}
                onClick={() => (tier === 'paying' ? document.getElementById('mirror')?.scrollIntoView({ behavior: 'smooth' }) : startCheckout())}
              >
                {tier === 'paying' ? 'open the mirror ✦' : 'flip all three →'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* ══ card overlay ══ */}
      {openCard ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setOpenCard(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(11,8,15,.55)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', width: 'min(420px,100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, background: 'radial-gradient(125% 80% at 50% 0%,rgba(127,119,221,.1),#fff 58%)', border: '1px solid rgba(11,8,15,.08)', boxShadow: '0 40px 80px -40px rgba(0,0,0,.6)', padding: '24px 22px 18px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 280 }}>
              <div style={{ position: 'absolute', inset: 7, border: '.5px solid rgba(11,8,15,.08)', borderRadius: 17, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', background: 'rgba(127,119,221,.13)', border: '.5px solid rgba(127,119,221,.33)', color: VIOLET, fontSize: 11 }}>✦</span>
                <span className="eyebrow" style={{ color: VIOLET, letterSpacing: '.16em', fontSize: 9.5 }}>{openCard.angleLabel}</span>
              </div>
              <span style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', fontFamily: NEWS, fontStyle: 'italic', fontSize: 22, lineHeight: 1.32, color: '#1b0f16', textAlign: 'center' }}>
                {openCard.text}
              </span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderTop: '.5px solid rgba(11,8,15,.08)', paddingTop: 12 }}>
                <span style={{ fontFamily: SORA, fontWeight: 700, fontSize: 12, letterSpacing: '-.02em', color: '#1b0f16' }}>shut<span style={{ color: '#e7548a' }}>ap</span></span>
              </div>
            </div>

            {!openCard.id ? (
              <div style={{ textAlign: 'center', fontFamily: SORA, fontSize: 13, color: '#f0dbe6' }}>this one's not saved.</div>
            ) : null}
            {postedAlias ? (
              <div style={{ textAlign: 'center', fontFamily: SORA, fontSize: 13, color: '#f7b8d4' }}>
                ◎ it's a room now — {postedAlias} is on it. no one owes you a reply.
              </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="pill" style={{ background: '#fff', color: '#0b080f', height: 42 }} onClick={() => void doShare()}>↗ share</button>
              <button className="pill" style={{ background: '#fff', color: '#0b080f', height: 42 }} onClick={() => void doDownload()}>↓ download</button>
              <button className="pill" style={{ background: '#fff', color: '#0b080f', height: 42 }} onClick={() => void doPost()}>◎ post to a room</button>
              <button className="pill" style={{ background: 'rgba(255,255,255,.14)', color: '#fff', height: 42 }} onClick={() => setOpenCard(null)}>close</button>
            </div>
            {!openCard.id ? (
              <div style={{ textAlign: 'center' }}>
                <button className="pill pill-wine" style={{ height: 42 }} onClick={() => { jokeTrack('share_blocked_signin', tier, { via: 'keep' }); raiseSheet('keep', { type: 'keep' }) }}>
                  wanna keep this one? →
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <SignInSheet open={sheet.open} trigger={sheet.trigger} onClose={() => setSheet({ open: false, trigger: 'keep' })} />

      {toast ? (
        <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 95, background: '#1b0f16', color: '#fff', fontFamily: SORA, fontSize: 13, padding: '11px 18px', borderRadius: 999 }}>
          {toast}
        </div>
      ) : null}
    </>
  )
}

function held_position(set: SetState, card: JokeCard): number {
  const idx = set.cards.findIndex((c) => c && c.text === card.text)
  return idx >= 0 ? idx : card.position
}
