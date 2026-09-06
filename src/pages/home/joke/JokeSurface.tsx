/* The joke-card surface.
 *
 * The flow, in the order a person meets it:
 *   spill → the companion OFFERS three cards → three cards → read them
 *   → save / share → (guest) the alias gate → (free) the clean-cards upsell
 *   → (member) clean exports and the offer to post it in a room.
 *
 * Three rules hold the shape, and every branch below obeys them:
 *   · reading is free at every tier, guests included. Nothing gates a card.
 *   · the companion offers the cards at a positive peak. There is no
 *     standalone share button anywhere on this surface.
 *   · crisis outranks all of it: no cards, no gate, no paywall.
 *
 * The tier, the card text and the export size are all resolved on the server.
 * This component only draws what it is handed. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { supabase } from '@/integrations/supabase/client'
import {
  submitJokeEntry,
  dealJokeCards,
  rerollJokeCard,
  claimJokeSession,
  listMyJokeCards,
  postJokeCardToRoom,
  exportJokeCards,
} from '@/lib/jokes.functions'
import { ARCHETYPE_LABEL, SLOTS, angleAccent, exportSpec, type JokeCard, type JokeTier } from '@/lib/jokes/deck'
import { PLAN_TO_PRICE, usd } from '@/lib/pricing'
import {
  anonSessionId,
  clearAnonSessionId,
  jokeTrack,
  svgToPng,
  saveBlob,
  zipStored,
} from './jokeClient'
import { CardFace } from './CardFace'
import { SignInSheet } from './SignInSheet'
import { AliasCeremony, type CeremonyAlias } from './AliasCeremony'
import { CardShareSheet } from './CardShareSheet'
import { UpgradeSheet } from './UpgradeSheet'
import { Button, CompanionLine, Eyebrow, SORA, NEWS, INK, MUTED, FAINT, ACCENT } from './ui'

/** What the reader asked for when the alias gate went up, resumed afterwards. */
type Pending = { type: 'save' } | { type: 'share' } | { type: 'saveSet' } | { type: 'post' } | { type: 'checkout' }

type SetState = { id: string; situation: string; archetype: string }

const PRICE = usd(PLAN_TO_PRICE.monthly.amount)

export function JokeSurface() {
  const navigate = useNavigate()
  const submit = useServerFn(submitJokeEntry)
  const deal = useServerFn(dealJokeCards)
  const reroll = useServerFn(rerollJokeCard)
  const claim = useServerFn(claimJokeSession)
  const listCards = useServerFn(listMyJokeCards)
  const postCard = useServerFn(postJokeCardToRoom)
  const exportCards = useServerFn(exportJokeCards)

  // ── composer ──
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [howOpen, setHowOpen] = useState(false)

  // ── identity ──
  const [tier, setTier] = useState<JokeTier>('guest')
  const [alias, setAlias] = useState<CeremonyAlias | null>(null)
  const [ceremonyOpen, setCeremonyOpen] = useState(false)

  // ── the set ──
  const [crisis, setCrisis] = useState(false)
  const [set, setSet] = useState<SetState | null>(null)
  const [cards, setCards] = useState<JokeCard[]>([])
  // 'reading' while the spill is scrubbed and read, 'dealing' while the three
  // cards are written. One uninterrupted move from the composer to the deck.
  const [phase, setPhase] = useState<'idle' | 'reading' | 'dealing'>('idle')
  const [dealFailed, setDealFailed] = useState(false)
  const [index, setIndex] = useState(0)
  const [rerolling, setRerolling] = useState<number | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)

  // ── the after-save moment ──
  const [shareOpen, setShareOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [postedAlias, setPostedAlias] = useState<string | null>(null)

  // ── the rest ──
  const [list, setList] = useState<JokeCard[]>([])
  const [gate, setGate] = useState<{ open: boolean; trigger: string }>({ open: false, trigger: 'save' })
  const [toast, setToast] = useState<string | null>(null)
  const [resumeAt, setResumeAt] = useState(0)
  const pending = useRef<Pending | null>(null)
  const deckRef = useRef<HTMLDivElement | null>(null)
  const touchX = useRef<number | null>(null)

  const signedIn = tier !== 'guest'
  const spec = exportSpec(tier)
  const card = cards[index] ?? null

  const ctx = useCallback(
    // No timezone is sent: the server derives the day from stored state only.
    () => ({ anon_session_id: anonSessionId() }),
    [],
  )

  const say = useCallback((m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await listCards({ data: {} })
      setTier(res.tier)
      setList(res.cards)
      if (res.alias) setAlias(res.alias)
    } catch { /* stay guest */ }
  }, [listCards])

  useEffect(() => { void refresh() }, [refresh])

  // ─────────────────────── the alias gate, resumed ───────────────────────

  // Resuming runs from an EFFECT rather than from inside the claim callback:
  // the claim writes the freshly persisted cards into state, and the action it
  // resumes needs their new ids. Bumping this counter defers the action to the
  // commit that carries them.
  useEffect(() => {
    if (!resumeAt) return
    const p = pending.current
    pending.current = null
    if (!p) return
    if (p.type === 'save') void doSave()
    else if (p.type === 'saveSet') void doSaveSet()
    else if (p.type === 'share') setShareOpen(true)
    else if (p.type === 'post') void doPost()
    else if (p.type === 'checkout') void navigate({ to: '/subscribe' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeAt])

  /** Sign-in lands back on this page. Claim the guest session, then resume. */
  const claimAndResume = useCallback(async () => {
    // Whatever they were reading as a guest rides along, so the gate costs
    // them none of it.
    const held = set
      ? cards
          .filter((c) => !c.id)
          .map((c) => ({
            set_id: set.id,
            position: c.position,
            angle: c.angle,
            text: c.text,
            used_fallback: c.used_fallback,
            judge_score: c.judge_score,
          }))
      : []
    try {
      // The app also has a background anonymous auth session. Wait for an
      // actual email-authenticated user, not merely any access token.
      let realSession = false
      for (let i = 0; i < 12 && !realSession; i++) {
        const session = (await supabase.auth.getSession()).data.session
        realSession = !!session?.access_token && session.user.is_anonymous !== true
        if (!realSession) await new Promise((r) => setTimeout(r, 250))
      }
      if (!realSession) return
      const res = await claim({ data: { ...ctx(), hold: held } })
      // The anonymous bootstrap session can still reach here; the server
      // refuses it in kind rather than throwing, and there is nothing to claim.
      if (!res.ok) return
      setTier(res.tier)
      clearAnonSessionId()
      if (res.alias) setAlias(res.alias)
      if (res.claimed.length) {
        jokeTrack('guest_cards_claimed', res.tier, { n: res.claimed.length })
        setCards((prev) =>
          prev.map((c) => res.claimed.find((k) => k.position === c.position) ?? c),
        )
      }
      jokeTrack('signin_completed', res.tier, { alias_is_new: res.alias_is_new })
      await refresh()

      // A brand-new alias gets its ceremony; a returning one goes straight
      // back to whatever they were doing.
      if (res.alias_is_new) setCeremonyOpen(true)
      else setResumeAt((n) => n + 1)
    } catch { /* leave them signed in without a claim */ }
  }, [claim, ctx, cards, set, refresh])

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Anonymous bootstrap also emits SIGNED_IN. Only a real account may
      // claim guest sets/cards or resume a blocked action.
      if (event === 'SIGNED_IN' && session?.user.is_anonymous !== true) {
        void claimAndResume()
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [claimAndResume])

  function raiseGate(trigger: string, p: Pending) {
    pending.current = p
    setGate({ open: true, trigger })
    jokeTrack('alias_gate_shown', tier, { trigger })
  }

  function closeCeremony() {
    setCeremonyOpen(false)
    jokeTrack('alias_ceremony_done', tier)
    say(alias ? `you're in. ${alias.emoji} ${alias.display_name}` : "you're in.")
    setResumeAt((n) => n + 1)
  }

  // ─────────────────────────── the spill ───────────────────────────

  /** Saying it is the whole gesture: one send, and the cards are being written.
   *  There is no second button between the spill and the deck. */
  async function onSubmit() {
    const raw = text.trim()
    if (raw.length < 12) { say('give me a few more words and i will find the funny in it.'); return }
    if (phase !== 'idle') return
    setBusy(true)
    setRefusal(null)
    setDealFailed(false)
    setPhase('reading')
    let opened: { id: string; tier: JokeTier } | null = null
    try {
      const res = await submit({ data: { raw, ...ctx() } })
      jokeTrack('entry_submitted', tier, { chars: raw.length })
      if (res.crisis) {
        // No cards, no gate, no paywall. Pain is never the thing being sold.
        setSet(null); setCards([]); setCrisis(true)
        jokeTrack('crisis_route_shown', tier)
        return
      }
      setCrisis(false)
      setTier(res.tier)
      setSet({ id: res.set_id, situation: res.clean_text, archetype: res.archetype })
      setCards([])
      setIndex(0)
      setSaved(null)
      setPostedAlias(null)
      opened = { id: res.set_id, tier: res.tier }
      requestAnimationFrame(() => {
        const el = deckRef.current
        if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 72), behavior: 'smooth' })
      })
    } catch {
      say('that did not go through. try again?')
    } finally {
      setBusy(false)
      if (!opened) setPhase('idle')
    }
    // Outside the try so a failed deal reports as a failed deal, not as a
    // spill that never landed — the set is open either way.
    if (opened) await dealCards(opened.id)
  }

  // ─────────────────────── the three cards ───────────────────────

  /** Writes all three. Takes the id rather than reading `set`, because the
   *  deal follows the spill inside one turn, before that state has committed. */
  async function dealCards(setId: string) {
    setPhase('dealing')
    setRefusal(null)
    setDealFailed(false)
    try {
      const res = await deal({ data: { set_id: setId, ...ctx() } })
      if (!res.ok) {
        jokeTrack('deal_refused', res.tier, { reason: res.reason })
        setRefusal(refusalCopy(res.reason))
        return
      }
      setTier(res.tier)
      setCards(res.cards)
      setIndex(0)
      jokeTrack('cards_dealt', res.tier, {
        fallbacks: res.cards.filter((c) => c.used_fallback).length,
      })
      if (res.tier !== 'guest') void refresh()
    } catch {
      setDealFailed(true)
      say('the deck jammed on that one. one more go?')
    } finally {
      setPhase('idle')
    }
  }

  async function anotherOne() {
    if (!set || rerolling !== null || !card) return
    const position = card.position
    setRerolling(position)
    setRefusal(null)
    try {
      const res = await reroll({ data: { set_id: set.id, position, ...ctx() } })
      if (!res.ok) {
        jokeTrack('reroll_refused', res.tier, { reason: res.reason })
        setRefusal(refusalCopy(res.reason))
        return
      }
      setTier(res.tier)
      setCards((prev) => prev.map((c) => (c.position === position ? res.card : c)))
      setSaved(null)
      jokeTrack('card_rerolled', res.tier, { position })
      if (res.tier !== 'guest') void refresh()
    } catch {
      say('that one would not land. try again?')
    } finally {
      setRerolling(null)
    }
  }

  // ─────────────────────── save · share · post ───────────────────────

  async function doSave() {
    const target = cards[index]
    if (!target) return
    if (!signedIn || !target.id) { raiseGate('save', { type: 'save' }); return }
    setSaving(true)
    try {
      const res = await exportCards({ data: { card_id: target.id, ...ctx() } })
      const image = res.images[0]
      if (!image) throw new Error('no image')
      const png = await svgToPng(image.svg, res.width, res.height)
      saveBlob(png, image.filename)
      setSaved(`${res.width}×${res.height}`)
      jokeTrack('save_completed', res.tier, { angle: target.angle, mark: res.mark })
    } catch {
      say('the image did not render. try once more?')
    } finally {
      setSaving(false)
    }
  }

  /** Members save the whole set in one tap — three PNGs in one zip. */
  async function doSaveSet() {
    if (!set) return
    if (!signedIn) { raiseGate('save', { type: 'saveSet' }); return }
    setSaving(true)
    try {
      const res = await exportCards({ data: { set_id: set.id, ...ctx() } })
      if (res.images.length < 2) { await doSave(); return }
      const files = await Promise.all(
        res.images.map(async (image) => ({
          name: image.filename,
          blob: await svgToPng(image.svg, res.width, res.height),
        })),
      )
      saveBlob(await zipStored(files), `shutap-cards-${set.id.slice(0, 8)}.zip`)
      setSaved(`${res.width}×${res.height} · the whole set`)
      jokeTrack('save_set_completed', res.tier, { n: files.length })
    } catch {
      say('the set did not render. try once more?')
    } finally {
      setSaving(false)
    }
  }

  function openShare() {
    const target = cards[index]
    if (!target) return
    if (!signedIn || !target.id) { raiseGate('share', { type: 'share' }); return }
    jokeTrack('share_sheet_shown', tier, { angle: target.angle })
    setShareOpen(true)
  }

  async function doPost() {
    const target = cards[index]
    if (!target) return
    if (!signedIn || !target.id) { raiseGate('post', { type: 'post' }); return }
    try {
      const res = await postCard({ data: { card_id: target.id, ...ctx() } })
      setPostedAlias(res.alias ?? alias?.display_name ?? 'you')
      jokeTrack('card_posted_to_room', tier, { angle: target.angle })
      void refresh()
    } catch { say('could not open the room. try again?') }
  }

  function startCheckout() {
    if (!signedIn) { raiseGate('checkout', { type: 'checkout' }); return }
    jokeTrack('checkout_started', tier, { lookup_key: 'mirror_monthly' })
    setUpgradeOpen(false)
    void navigate({ to: '/subscribe' })
  }

  // ─────────────────────────── derived copy ───────────────────────────

  const days = useMemo(() => new Set(list.map((c) => c.day).filter(Boolean)).size, [list])

  const dealingLine = useMemo(() => {
    if (tier === 'paying') {
      return "i have been waiting all week for one like this. writing your set now."
    }
    if (tier === 'free') {
      return 'that one deserves a set. writing it now.'
    }
    return "okay, that's the bit that's getting me. writing you a set — a take, a clapback, and one light roast of the situation itself."
  }, [tier])

  const hint = text.trim().length === 0
    ? ''
    : text.trim().length < 30
      ? 'keep going — the specifics are what make it funny.'
      : 'that will do it.'

  return (
    <>
      {/* ══ 1 · hero + the composer ══ */}
      <section id="joke" style={{ position: 'relative', overflow: 'hidden', background: '#fff', padding: 'clamp(92px,12vh,132px) clamp(16px,4vw,28px) clamp(24px,4vh,44px)' }}>
        <div style={{ position: 'absolute', inset: '-40% -20% auto', height: '80vh', background: 'radial-gradient(ellipse at 50% 35%,rgba(127,119,221,.13),transparent 64%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(13px,2.2vh,20px)' }}>
          <Eyebrow style={{ display: 'inline-flex', alignItems: 'center', gap: 8, letterSpacing: '.24em' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT }} />
            pseudonymous · no advice · different perspectives
          </Eyebrow>
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
                <span style={{ width: '.055em', height: '.055em', borderRadius: '50%', background: ACCENT }} />
              </span>
            </span>
            <br />
            <span style={{ fontFamily: NEWS, fontStyle: 'italic', fontWeight: 400, letterSpacing: '-.02em', color: '#8e1c4c' }}>joke about it.</span>
          </h1>
          <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 'clamp(17px,2vw,22px)', lineHeight: 1.45, color: '#443c42', textAlign: 'center', maxWidth: '34ch', margin: 0 }}>
            life&apos;s a bitch. so make fun of it.
          </p>
          <p style={{ fontFamily: SORA, fontSize: 13.5, color: FAINT, textAlign: 'center', margin: 0 }}>
            type the thing that&apos;s living in your head. shutap writes the set.
          </p>



          <div style={{ width: '100%', position: 'relative', background: '#fff', border: '2px solid rgba(231,84,138,.55)', borderRadius: 26, padding: 'clamp(16px,2.4vw,22px)', boxShadow: '0 28px 60px -38px rgba(35,26,32,.28)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends, shift+enter breaks the line. isComposing keeps
                // an IME's own enter (picking a candidate) from sending.
                if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
                e.preventDefault()
                void onSubmit()
              }}
              enterKeyHint="send"
              placeholder="whatever it is. the comment, the meeting, the text at 11pm, the thing they did again."
              disabled={phase !== 'idle'}
              style={{ width: '100%', resize: 'vertical', minHeight: 116, border: 'none', outline: 'none', background: 'transparent', fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, lineHeight: 1.55, color: '#2b2429', opacity: phase === 'idle' ? 1 : 0.6 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SORA, fontSize: 12, color: FAINT }}>
                enter sends · shift + enter for a new line
              </span>
              <Button onClick={() => void onSubmit()} disabled={phase !== 'idle'}>
                {phase === 'reading' ? 'reading it…' : phase === 'dealing' ? 'writing your set…' : 'write my set'}
              </Button>
            </div>
          </div>

          {/* footnote row + hover-expand explainer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: SORA, fontSize: 12.5, color: '#8a7a84' }}>
              <span>{signedIn ? 'names scrubbed before anything saves' : 'no account · names scrubbed'}</span>
              <span aria-hidden>·</span>
              <span onMouseEnter={() => setHowOpen(true)} onMouseLeave={() => setHowOpen(false)} style={{ display: 'inline-flex' }}>
                <button
                  type="button"
                  aria-expanded={howOpen}
                  onClick={() => setHowOpen((v) => !v)}
                  onFocus={() => setHowOpen(true)}
                  onBlur={() => setHowOpen(false)}
                  style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: SORA, fontSize: 12.5, color: MUTED, textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  how it works
                </button>
              </span>
            </div>
            <div
              onMouseEnter={() => setHowOpen(true)}
              onMouseLeave={() => setHowOpen(false)}
              style={{
                maxWidth: 460, overflow: 'hidden',
                maxHeight: howOpen ? 240 : 0,
                opacity: howOpen ? 1 : 0,
                transform: howOpen ? 'none' : 'translateY(-4px)',
                transition: 'max-height .38s cubic-bezier(.2,.8,.2,1), opacity .28s, transform .28s',
              }}
            >
              <ol style={{ margin: 0, padding: '12px 18px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, background: 'rgba(127,119,221,.06)', border: '1px solid rgba(11,8,15,.07)', borderRadius: 18, fontFamily: NEWS, fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.5, color: '#443c42', textAlign: 'left' }}>
                <li><span style={{ color: '#8e1c4c' }}>i.</span> type what happened — names get scrubbed before anything saves.</li>
                <li><span style={{ color: '#8e1c4c' }}>ii.</span> if it lands well, i write you a set: a take, a clapback, a roast.</li>
                <li><span style={{ color: '#8e1c4c' }}>iii.</span> reading the set is free. an alias is only needed to save or share one.</li>
              </ol>
            </div>
          </div>

          {hint ? <div style={{ fontFamily: SORA, fontSize: 12.5, color: '#8a7a84' }}>{hint}</div> : null}

          {set && set.archetype !== 'general' ? (
            <div style={{ fontFamily: SORA, fontSize: 13, color: MUTED }}>
              ✦ reading this as <strong style={{ color: '#8e1c4c', fontWeight: 600 }}>{ARCHETYPE_LABEL[set.archetype] ?? set.archetype}</strong>
            </div>
          ) : null}
        </div>
      </section>

      {/* ══ 2 · crisis — support register only, and nothing else ══ */}
      {crisis ? (
        <section style={{ background: '#fff', padding: '0 clamp(16px,4vw,28px) clamp(40px,7vh,80px)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', background: '#fff', border: '1px solid rgba(137,0,65,.35)', borderRadius: 22, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 19, color: '#890041' }}>no jokes for this one.</div>
            <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, lineHeight: 1.6, color: '#383136' }}>
              what you just wrote is heavier than a card can hold, and i&apos;m not going to make a punchline out of it. talking to a person helps more than i can right now.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <a href="#support" style={{ textDecoration: 'none' }}><Button variant="secondary" size="sm">support lines →</Button></a>
              <a href="#spill" style={{ textDecoration: 'none' }}><Button variant="ghost" size="sm">say the long version instead</Button></a>
            </div>
          </div>
        </section>
      ) : null}

      {/* ══ 3 · the offer, then the three cards ══ */}
      {set && !crisis ? (
        <section ref={deckRef} style={{ background: 'linear-gradient(180deg,#fff,rgba(16,12,20,.04))', padding: 'clamp(16px,3vh,36px) clamp(16px,4vw,28px) clamp(36px,6vh,72px)' }}>
          <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* the wait, in the companion's voice — three cards take three
                model calls, so the screen says what is happening */}
            {phase === 'dealing' && cards.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <CompanionLine>{dealingLine}</CompanionLine>
                <DealingSkeleton />
                <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 13.5, color: FAINT, textAlign: 'center' }}>
                  nobody sees the cards unless you post them.
                </div>
              </div>
            ) : null}

            {/* the set is open, so a jam is retried as a deal, never as a respill */}
            {dealFailed && phase === 'idle' && cards.length === 0 && set ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 15.5, color: MUTED, textAlign: 'center' }}>
                  that one jammed on the way out. your words are still here.
                </div>
                <Button variant="secondary" size="sm" onClick={() => void dealCards(set.id)}>
                  ↻ try the cards again
                </Button>
              </div>
            ) : null}

            {cards.length === 3 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 17, letterSpacing: '-.03em', color: INK }}>
                    your set
                  </div>
                  <div aria-hidden style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                    {cards.map((c, i) => (
                      <span key={c.position} style={{ width: 6, height: 6, borderRadius: '50%', background: i === index ? '#8e1c4c' : 'rgba(11,8,15,.18)' }} />
                    ))}
                  </div>
                </div>

                {/* slot tabs — the same three for everyone */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {cards.map((c, i) => (
                    <button
                      key={c.position}
                      type="button"
                      onClick={() => { setIndex(i); setSaved(null); setPostedAlias(null) }}
                      style={{
                        flex: 1, height: 34, borderRadius: 999, cursor: 'pointer',
                        fontFamily: SORA, fontWeight: 700, fontSize: 12.5,
                        border: i === index ? 'none' : '1px solid rgba(11,8,15,.12)',
                        background: i === index ? angleAccent(c.angle) : '#fff',
                        color: i === index ? '#fff' : MUTED,
                        transition: 'background .2s, color .2s',
                      }}
                    >
                      {c.angleLabel}
                    </button>
                  ))}
                </div>

                <div
                  onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null }}
                  onTouchEnd={(e) => {
                    const start = touchX.current
                    const end = e.changedTouches[0]?.clientX ?? null
                    touchX.current = null
                    if (start === null || end === null || Math.abs(end - start) < 48) return
                    setIndex((i) => Math.min(2, Math.max(0, i + (end < start ? 1 : -1))))
                    setSaved(null)
                    setPostedAlias(null)
                  }}
                >
                  {card ? (
                    <CardFace
                      card={card}
                      situation={set.situation}
                      mark={tier !== 'paying'}
                      loading={rerolling === card.position}
                    />
                  ) : null}
                </div>

                {/* the action row — reading is above it, and never gated */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button variant="secondary" size="sm" onClick={() => void anotherOne()} disabled={rerolling !== null}>
                    ↻ {tier === 'guest' ? 'another take' : 'another one'}
                  </Button>
                  <Button
                    variant={signedIn ? 'secondary' : 'locked'}
                    size="sm"
                    onClick={() => (spec.set && signedIn ? void doSaveSet() : void doSave())}
                    disabled={saving}
                    title={signedIn ? undefined : 'an alias first — 30 seconds, no real name'}
                  >
                    {signedIn ? '↓' : '🔒'} {spec.set && signedIn ? 'save the set' : 'save'}
                  </Button>
                  <Button
                    variant={signedIn ? 'secondary' : 'locked'}
                    size="sm"
                    onClick={openShare}
                    title={signedIn ? undefined : 'an alias first — 30 seconds, no real name'}
                  >
                    {signedIn ? '↗' : '🔒'} share
                  </Button>
                </div>

                <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 14, color: FAINT, textAlign: 'center' }}>
                  {tier === 'guest'
                    ? 'swipe them all you want. reading is free, forever.'
                    : tier === 'paying'
                      ? `clean · ${spec.width}×${spec.height} · no mark on any of them.`
                      : `saves at ${spec.width}×${spec.height}, with the little shutap mark.`}
                </div>

                {/* the moment after the save — a win first, an offer second */}
                {saved ? (
                  <div style={{ background: '#fff', border: '1px solid rgba(11,8,15,.08)', borderRadius: 22, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 14, color: '#1D9E75' }}>
                      ✓ saved{tier === 'paying' ? ' clean' : ''} · {saved}
                    </div>
                    {tier === 'paying' ? (
                      <>
                        <CompanionLine>
                          no mark, nothing of mine on it. post the roast in your room too? the owl who&apos;s been sitting in will lose it.
                        </CompanionLine>
                        {postedAlias ? (
                          <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 15, color: MUTED }}>
                            ◎ it&apos;s a room now — {postedAlias} is on it. no one owes you a reply.
                          </div>
                        ) : (
                          <>
                            <Button variant="secondary" onClick={() => void doPost()} full>post it in my room</Button>
                            <Button variant="ghost" size="sm" onClick={() => setSaved(null)} full>done</Button>
                            <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 13.5, color: FAINT, textAlign: 'center' }}>
                              keeping it private is the default. it&apos;s just yours.
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <CompanionLine>
                          it&apos;s yours. want it without my little mark on the corner — and four times bigger, for printing on something petty?
                        </CompanionLine>
                        <Button onClick={() => { jokeTrack('upgrade_shown', tier, { after: 'save' }); setUpgradeOpen(true) }} full>
                          see clean cards
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSaved(null)} full>this one&apos;s fine</Button>
                      </>
                    )}
                  </div>
                ) : null}
              </>
            ) : null}

            {refusal ? (
              <div style={{ background: '#fff', border: '1px dashed rgba(142,28,76,.32)', borderRadius: 18, padding: '16px 20px' }}>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 15, color: INK }}>{refusal}</div>
                <div style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 14.5, color: MUTED, marginTop: 4 }}>
                  the cards you already have stay right here, and stay free.
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ══ 4 · the set list, and the one place the plan is mentioned unprompted ══ */}
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
                  style={{ background: '#fff', border: '1px solid rgba(11,8,15,.08)', borderRadius: 22, padding: '18px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 160 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <Eyebrow style={{ fontSize: 9, letterSpacing: '.16em', color: angleAccent(c.angle) }}>{c.angleLabel}</Eyebrow>
                    {c.room_id ? <Eyebrow style={{ fontSize: 9, color: '#8e1c4c' }}>🃏 in a room</Eyebrow> : null}
                  </div>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NEWS, fontStyle: 'italic', fontSize: 16, lineHeight: 1.32, color: '#1b0f16', textAlign: 'center' }}>
                    {c.text}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 6, background: 'radial-gradient(120% 120% at 10% 0%,rgba(127,119,221,.06),#fff 65%)', border: '1px solid rgba(11,8,15,.08)', borderRadius: 22, padding: 'clamp(20px,3vw,30px)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
              <div style={{ maxWidth: '52ch' }}>
                <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 'clamp(20px,2.6vw,26px)', letterSpacing: '-.03em', color: INK }}>
                  {tier === 'paying' ? 'the mirror is reading all of it.' : 'there is a pattern across these you cannot see yet.'}
                </div>
                <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, lineHeight: 1.55, color: '#4a3040', marginTop: 6 }}>
                  {tier === 'paying'
                    ? `cross-read, districts, depth, trend and signal mix — now with 🃏 joke in the mix, across ${list.length} ${list.length === 1 ? 'card' : 'cards'}.`
                    : `the mirror reads your whole set list at once — which behaviour keeps showing up, and how the jokes changed as you did.`}
                </p>
              </div>
              <Button
                onClick={() => (tier === 'paying'
                  ? document.getElementById('mirror')?.scrollIntoView({ behavior: 'smooth' })
                  : (jokeTrack('upgrade_shown', tier, { after: 'set_list' }), setUpgradeOpen(true)))}
              >
                {tier === 'paying' ? 'open the mirror ✦' : 'see clean cards'}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <SignInSheet open={gate.open} trigger={gate.trigger} onClose={() => setGate({ open: false, trigger: 'save' })} />

      <AliasCeremony
        open={ceremonyOpen}
        alias={alias}
        onAliasChange={setAlias}
        onDone={closeCeremony}
      />

      <CardShareSheet
        open={shareOpen}
        card={card}
        tier={tier}
        saving={saving}
        onClose={() => setShareOpen(false)}
        onSave={() => void doSave()}
        onSaveSet={() => void doSaveSet()}
        onNote={say}
      />

      <UpgradeSheet
        open={upgradeOpen}
        price={PRICE}
        tier={tier}
        onClose={() => setUpgradeOpen(false)}
        onCheckout={startCheckout}
      />

      {toast ? (
        <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 99, background: '#1b0f16', color: '#fff', fontFamily: SORA, fontSize: 13, padding: '11px 18px', borderRadius: 999, maxWidth: 'calc(100vw - 32px)', textAlign: 'center' }}>
          {toast}
        </div>
      ) : null}
    </>
  )
}

/* Three card-shaped placeholders, in the deck's own proportions, so the wait
   holds the space the cards are about to fill instead of collapsing the page
   and shoving it back down when they land. */
function DealingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {SLOTS.map((slot) => (
          <div
            key={slot.key}
            style={{
              flex: 1, height: 34, borderRadius: 999,
              border: '1px solid rgba(11,8,15,.10)', background: '#fff',
              display: 'grid', placeItems: 'center',
              fontFamily: SORA, fontWeight: 700, fontSize: 12.5, color: FAINT,
            }}
          >
            {slot.label}
          </div>
        ))}
      </div>
      <div
        style={{
          width: '100%', aspectRatio: '9/16', maxHeight: '62vh', borderRadius: 26,
          background: 'radial-gradient(135% 78% at 50% 0%,#3a1022,#1a0a12 60%,#120710)',
          border: '.5px solid rgba(255,255,255,.16)',
          boxShadow: '0 22px 50px -24px rgba(0,0,0,.7)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div className="shutap-deal-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <style>{`
        .shutap-deal-shimmer{
          background:linear-gradient(100deg,transparent 20%,rgba(231,84,138,.16) 50%,transparent 80%);
          background-size:220% 100%;
          animation:shutapDeal 1.5s ease-in-out infinite;
        }
        @keyframes shutapDeal{from{background-position:180% 0}to{background-position:-80% 0}}
        @media (prefers-reduced-motion: reduce){
          .shutap-deal-shimmer{animation:none;background:rgba(231,84,138,.10)}
        }
      `}</style>
    </div>
  )
}

/** Refusals are cost guards, not paywalls: they never point at checkout. */
function refusalCopy(reason: 'daily_cards' | 'daily_sets' | 'rate_limited' | 'not_found'): string {
  if (reason === 'rate_limited') return "easy — you've been flipping fast. back in a minute."
  if (reason === 'daily_sets') return "that's the last situation i can write for today. the deck resets tomorrow."
  if (reason === 'daily_cards') return "i'm out of jokes for today — genuinely, not as a sales pitch. tomorrow they're back."
  return 'i lost track of that set. say it again and i will start over.'
}
