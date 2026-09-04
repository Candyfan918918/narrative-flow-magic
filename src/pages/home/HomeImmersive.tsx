/* HomeImmersive — joke cards are the landing surface.
 * Order: hero + box + set + list + paywall → chapters → rooms → faq →
 * support → finale. The chapters keep their self-playing demos. */
import { EyeGradients } from './sections/EyeGradients'
import { HomeHeader } from './sections/Header'
import { JokeSurface } from './joke/JokeSurface'
import { Chapter01Spill } from './sections/Chapter01Spill'
import { Chapter02Scan } from './sections/Chapter02Scan'
import { Chapter03Mirror } from './sections/Chapter03Mirror'
import { RoomsStrip } from './sections/RoomsStrip'
import { FAQ } from './sections/FAQ'
import { SupportLines } from './sections/SupportLines'
import { Finale } from './sections/Finale'
import { CompanionSheet } from './sections/CompanionSheet'
import type { NewestRoom } from '@/lib/newest-rooms.functions'

export function HomeImmersive({ newestRooms = [] }: { openRoomsCount?: number; newestRooms?: NewestRoom[] } = {}) {
  return (
    <>
      <EyeGradients />
      <HomeHeader />
      <main>
        <JokeSurface />
        <section style={{ padding: 'clamp(30px,5vh,64px) clamp(16px,4vw,28px) clamp(20px,3vh,40px)' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div className="eyebrow">the rest of shutap · still here</div>
            <h2 style={{ fontFamily: "'Sora',system-ui,sans-serif", fontWeight: 800, fontSize: 'clamp(26px,3.4vw,44px)', lineHeight: 1.08, letterSpacing: '-.04em' }}>
              a joke is the fast lane.{' '}
              <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontWeight: 400, color: '#8e1c4c' }}>it isn't the only one.</span>
            </h2>
          </div>
        </section>
        <div data-screen-label="Chapters" style={{ background: '#100c14', display: 'flex', flexDirection: 'column' }}>
          <div style={{ order: 2 }}><Chapter01Spill /></div>
          <div style={{ order: 1 }}><Chapter02Scan /></div>
          <div style={{ order: 3 }}><Chapter03Mirror /></div>
        </div>
        <RoomsStrip newestRooms={newestRooms} />
        <FAQ />
        <SupportLines />
        <Finale />
      </main>
      <CompanionSheet />
    </>
  )
}
