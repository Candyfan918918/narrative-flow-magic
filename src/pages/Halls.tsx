/* Native Hall of Fame hub. Presentation-only surface — no new backend.
 * Six halls, three windows, seeded leaderboard rows (halls have no real
 * data pipeline yet — getHallView() returns undefined). Rows link to
 * /stream; three tabs cross-link to the existing deep hall routes. */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'

import { SiteFooter } from '@/components/site/SiteFooter'
import { Words } from '@/components/motion'
import { useToast } from '@/components/Toast'
import type { HallSlug } from '@/lib/seo/halls'

type TabKey =
  | 'loving' | 'bravest' | 'healing' | 'relatable' | 'hardest' | 'funniest'
type WinKey = 'daily' | 'weekly' | 'all'
type Band = 'held' | 'honored' | 'legend'

interface HubEntry {
  rank: number
  emoji: string
  title: string
  alias: string
  same: number
  restedDaysAgo: number
  resonance: number
  band: Band
}

const TABS: Array<{ k: TabKey; emoji: string; label: string; deep: HallSlug | null }> = [
  { k: 'loving',    emoji: '🤍', label: 'most loving',    deep: 'best-outcomes' },
  { k: 'bravest',   emoji: '💪', label: 'bravest',        deep: 'longest-thread' },
  { k: 'healing',   emoji: '🌿', label: 'most healing',   deep: null },
  { k: 'relatable', emoji: '🫂', label: 'most relatable', deep: 'most-related' },
  { k: 'hardest',   emoji: '🪨', label: 'hardest-won',    deep: null },
  { k: 'funniest',  emoji: '😭', label: 'funniest',       deep: null },
]

const WINDOWS: Array<{ k: WinKey; label: string }> = [
  { k: 'daily',  label: 'daily' },
  { k: 'weekly', label: 'weekly' },
  { k: 'all',    label: 'all time' },
]

// Seed leaderboards — one small deck per hall. All entries link to /stream.
const SEED: Record<TabKey, HubEntry[]> = {
  loving: [
    { rank: 1, emoji: '🤍', title: "my dad wrote me a letter after 12 years of silence.",        alias: 'Quiet Nigerian Swan', same: 812, restedDaysAgo: 3, resonance: 96, band: 'legend' },
    { rank: 2, emoji: '🌸', title: 'my mom finally said she was proud of me.',                    alias: 'Soft Japanese Fox',    same: 604, restedDaysAgo: 6, resonance: 88, band: 'honored' },
    { rank: 3, emoji: '💌', title: 'I told my grandma I loved her before she went.',              alias: 'Tender Greek Deer',    same: 511, restedDaysAgo: 9, resonance: 82, band: 'honored' },
    { rank: 4, emoji: '🕯', title: 'my brother apologized. we cried in the driveway.',            alias: 'Gentle Kenyan Ibis',   same: 402, restedDaysAgo: 12, resonance: 74, band: 'held' },
    { rank: 5, emoji: '☕️', title: "my ex reached out to say she's sober now.",                   alias: 'Steady Chilean Hare',  same: 318, restedDaysAgo: 14, resonance: 68, band: 'held' },
  ],
  bravest: [
    { rank: 1, emoji: '🪨', title: 'I quit the job that was killing me. no offer waiting.',       alias: 'Defiant Italian Owl',  same: 921, restedDaysAgo: 2, resonance: 97, band: 'legend' },
    { rank: 2, emoji: '💪', title: "I told my parents I'm not going back to med school.",         alias: 'Loud Filipino Bear',   same: 688, restedDaysAgo: 5, resonance: 90, band: 'honored' },
    { rank: 3, emoji: '🚪', title: "I left the marriage. it took me nine years to.",              alias: 'Weary Turkish Wolf',   same: 542, restedDaysAgo: 8, resonance: 84, band: 'honored' },
    { rank: 4, emoji: '🛑', title: 'I called out my boss in the meeting. hands shaking.',         alias: 'Bright Indian Otter',  same: 407, restedDaysAgo: 11, resonance: 76, band: 'held' },
    { rank: 5, emoji: '📞', title: "I called the hotline. I'd never done that before.",           alias: 'Small Polish Lark',    same: 296, restedDaysAgo: 13, resonance: 70, band: 'held' },
  ],
  healing: [
    { rank: 1, emoji: '🌿', title: 'six months sober today. no one at home knows yet.',           alias: 'Patient Pakistani Hedgehog', same: 764, restedDaysAgo: 4, resonance: 94, band: 'legend' },
    { rank: 2, emoji: '🌱', title: "I finally started therapy. it's not what I feared.",          alias: 'Careful Mexican Wren',       same: 522, restedDaysAgo: 7, resonance: 86, band: 'honored' },
    { rank: 3, emoji: '🕊', title: "I stopped talking to the friend who kept draining me.",       alias: 'Restless Indian Lion',       same: 448, restedDaysAgo: 9, resonance: 80, band: 'honored' },
    { rank: 4, emoji: '💊', title: 'my meds are finally working. I laughed today.',                alias: 'Wistful Brazilian Fox',      same: 356, restedDaysAgo: 12, resonance: 72, band: 'held' },
    { rank: 5, emoji: '🛁', title: "I let myself rest for a whole weekend and didn't apologize.", alias: 'Quiet Filipino Owl',         same: 271, restedDaysAgo: 15, resonance: 66, band: 'held' },
  ],
  relatable: [
    { rank: 1, emoji: '🫂', title: "my brother and I haven't spoken in two years over a parking spot.", alias: 'Quiet Filipino Owl', same: 1204, restedDaysAgo: 1, resonance: 98, band: 'legend' },
    { rank: 2, emoji: '🍞', title: "I babysat for free for a neighbor who dropped me the second she could.", alias: 'Wistful Brazilian Fox', same: 812, restedDaysAgo: 4, resonance: 89, band: 'honored' },
    { rank: 3, emoji: '💼', title: "my coworker takes credit for my ideas in the exact meetings I can't attend.", alias: 'Defiant Kenyan Bear', same: 611, restedDaysAgo: 6, resonance: 83, band: 'honored' },
    { rank: 4, emoji: '🚌', title: 'I gave my seat to an old man on the train and he told me a story I can\'t forget.', alias: 'Restless Indian Lion', same: 458, restedDaysAgo: 10, resonance: 75, band: 'held' },
    { rank: 5, emoji: '📱', title: "she left me on read for four days. we live together.",         alias: 'Patient Pakistani Hedgehog', same: 341, restedDaysAgo: 13, resonance: 69, band: 'held' },
  ],
  hardest: [
    { rank: 1, emoji: '🪨', title: 'we buried my dad on tuesday. I went back to work wednesday.',  alias: 'Heavy Egyptian Crane',  same: 702, restedDaysAgo: 5, resonance: 93, band: 'legend' },
    { rank: 2, emoji: '⛰',  title: "I miscarried a second time. no one knows I was pregnant.",     alias: 'Silent Korean Hare',    same: 587, restedDaysAgo: 8, resonance: 87, band: 'honored' },
    { rank: 3, emoji: '🌧', title: "my kid told me they hate me. I didn't have a good answer.",   alias: 'Tired French Stag',     same: 456, restedDaysAgo: 11, resonance: 78, band: 'honored' },
    { rank: 4, emoji: '🕳', title: "I lost the house. we're staying with my mother-in-law.",       alias: 'Weary Turkish Wolf',    same: 372, restedDaysAgo: 13, resonance: 71, band: 'held' },
    { rank: 5, emoji: '🩹', title: "the diagnosis came back. I haven't told anyone yet.",          alias: 'Small Polish Lark',    same: 258, restedDaysAgo: 15, resonance: 64, band: 'held' },
  ],
  funniest: [
    { rank: 1, emoji: '😭', title: 'my roommate labels her cheese. all seven kinds.',              alias: 'Loud Filipino Bear',   same: 634, restedDaysAgo: 2, resonance: 91, band: 'legend' },
    { rank: 2, emoji: '🤣', title: "I sent 'i love you' to my boss instead of my partner.",       alias: 'Bright Indian Otter',  same: 512, restedDaysAgo: 5, resonance: 85, band: 'honored' },
    { rank: 3, emoji: '🙈', title: 'my toddler told the pediatrician I said the s-word.',          alias: 'Gentle Kenyan Ibis',   same: 421, restedDaysAgo: 7, resonance: 80, band: 'honored' },
    { rank: 4, emoji: '🎂', title: "I forgot my own birthday. my mom called at midnight in tears.", alias: 'Steady Chilean Hare',  same: 318, restedDaysAgo: 12, resonance: 74, band: 'held' },
    { rank: 5, emoji: '🚿', title: 'I sang in the shower. my apartment has no walls apparently.',  alias: 'Soft Japanese Fox',    same: 244, restedDaysAgo: 14, resonance: 67, band: 'held' },
  ],
}

const STATS = [
  { n: '3,841', label: 'inducted all time' },
  { n: '312',   label: 'rested this week' },
  { n: '71%',   label: 'tellers felt heard' },
  { n: '11',    label: 'Legend inductees', accent: true },
]

const BAND_STYLE: Record<Band, { bg: string; color: string; label: string; row: string }> = {
  held:    { bg: '#f7e8f0', color: '#6b4a5c', label: 'HELD',    row: '#fff' },
  honored: { bg: '#ffd5e4', color: '#c1216b', label: 'HONORED', row: '#fff' },
  legend:  { bg: 'linear-gradient(90deg,#ffd5e4,#ff7eb3)', color: '#890041', label: 'LEGEND', row: '#ffeef5' },
}

function resonanceColor(n: number): string {
  if (n >= 90) return '#890041'
  if (n >= 80) return '#c1216b'
  if (n >= 70) return '#e7548a'
  return '#9e7a8c'
}

export function HallOfFamePageNative() {
  const [tab, setTab] = useState<TabKey>('relatable')
  const [win, setWin] = useState<WinKey>('weekly')
  const { toast, ToastHost } = useToast()
  const navigate = useNavigate()

  const active = useMemo(() => TABS.find((t) => t.k === tab)!, [tab])
  const rows = SEED[tab]

  const onShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share) { await navigator.share({ title: 'shutap · hall of fame', url }); return }
      await navigator.clipboard.writeText(url)
      toast('link copied.')
    } catch { /* user dismissed */ }
  }

  const openDeep = () => {
    if (!active.deep) return
    navigate({
      to: '/halls/$hall/$region/$window',
      params: { hall: active.deep, region: 'global', window: '30d' },
    })
  }

  return (
    <div style={{ background: '#fdf0f5', minHeight: '100vh' }}>
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '32px 22px 80px' }}>
        {/* eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e7548a' }} />
          <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#e7548a' }}>
            hall of fame
          </span>
        </div>

        <Words as="h1" style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', fontSize: 'clamp(26px,5vw,36px)', margin: '0 0 10px', color: '#0b080f', letterSpacing: '-.01em', lineHeight: 1.15 }}>
          rooms the world remembered.
        </Words>
        <p style={{ fontFamily: 'Newsreader,serif', fontSize: 16, lineHeight: 1.55, color: '#6b4a5c', margin: '0 0 24px', maxWidth: '46ch' }}>
          rooms that rested with enough resonance to be inducted. six halls. real stories. real people.
        </p>

        {/* stats strip */}
        <div style={{ background: '#fff', border: '.5px solid rgba(11,8,15,.08)', borderRadius: 18, padding: '16px 18px', marginBottom: 26, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14 }}>
          {STATS.map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '-.02em', color: s.accent ? '#c1216b' : '#0b080f', fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
              <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: '#9e7a8c', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* hall tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {TABS.map((t) => {
            const isActive = t.k === tab
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className="hall-tab"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', borderRadius: 999,
                  border: '.5px solid rgba(11,8,15,.10)',
                  background: isActive ? '#0b080f' : '#fff',
                  color: isActive ? '#f7e8f0' : '#2e1a26',
                  fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14,
                  cursor: 'pointer', transition: 'border-color .18s, background .18s',
                }}
              >
                <span aria-hidden style={{ fontSize: 15 }}>{t.emoji}</span>
                {t.label}
              </button>
            )
          })}
        </div>

        {/* window mini-pills + share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {WINDOWS.map((w) => {
              const on = w.k === win
              return (
                <button
                  key={w.k}
                  onClick={() => setWin(w.k)}
                  style={{
                    padding: '5px 11px', borderRadius: 999, border: '.5px solid rgba(11,8,15,.12)',
                    background: on ? '#0b080f' : 'transparent',
                    color: on ? '#fff' : '#6b4a5c',
                    fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: '.06em',
                    cursor: 'pointer',
                  }}
                >{w.label}</button>
              )
            })}
          </div>
          <span style={{ flex: 1 }} />
          <button
            onClick={onShare}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: '#890041', fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14,
            }}
          >🔗 share this hall</button>
        </div>

        {/* leaderboard */}
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map((r, i) => {
            const bs = BAND_STYLE[r.band]
            const rowBg = r.rank === 1 ? '#fff5f9' : bs.row
            return (
              <Link
                key={r.rank}
                to="/stream"
                className="hall-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto 1fr auto auto',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 16,
                  background: rowBg,
                  border: '.5px solid rgba(11,8,15,.08)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform .18s, border-color .18s',
                  animation: `hall-fadeup .5s ease ${i * 60}ms both`,
                }}
              >
                <span style={{
                  fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 14, letterSpacing: '.02em',
                  color: r.rank === 1 ? '#c1216b' : '#9e7a8c', fontVariantNumeric: 'tabular-nums', minWidth: 26,
                }}>#{r.rank}</span>
                <span style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#f7e8f0',
                  display: 'grid', placeItems: 'center', fontSize: 17, flexShrink: 0,
                }}>{r.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 15.5, lineHeight: 1.35,
                    color: '#0b080f', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>{r.title}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 12, color: '#9e7a8c' }}>{r.alias}</span>
                    <span style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 12, color: '#6b4a5c' }}>
                      <strong style={{ color: '#c1216b', fontWeight: 700, fontStyle: 'normal', fontFamily: 'Sora,sans-serif', fontSize: 12 }}>{r.same.toLocaleString()}</strong> said 'omg same'
                    </span>
                    <span style={{ fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 12, color: '#9e7a8c' }}>· rested {r.restedDaysAgo}d ago</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{
                    fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-.02em',
                    color: resonanceColor(r.resonance), fontVariantNumeric: 'tabular-nums',
                  }}>{r.resonance}</div>
                  <div style={{
                    marginTop: 3, padding: '2px 7px', borderRadius: 999,
                    background: bs.bg, color: bs.color,
                    fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 9, letterSpacing: '.16em',
                    display: 'inline-block',
                  }}>{bs.label}</div>
                </div>
                <span style={{
                  fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14, color: '#890041', whiteSpace: 'nowrap',
                }}>enter →</span>
              </Link>
            )
          })}
        </div>

        {active.deep && (
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <button
              onClick={openDeep}
              style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                color: '#890041', fontFamily: "'Newsreader',serif", fontStyle: 'italic', fontSize: 14,
              }}
            >view the full {active.label} hall →</button>
          </div>
        )}
      </main>
      <SiteFooter />
      {ToastHost}
    </div>
  )
}
