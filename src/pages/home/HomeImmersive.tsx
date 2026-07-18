/* HomeImmersive — Pass 2: fully native React composition of `/`. */
import { EyeGradients } from './sections/EyeGradients'
import { HomeHeader } from './sections/Header'
import { Hero } from './sections/Hero'
import { Chapter01Spill } from './sections/Chapter01Spill'
import { Chapter02Scan } from './sections/Chapter02Scan'
import { Chapter03Mirror } from './sections/Chapter03Mirror'
import { RoomsStrip } from './sections/RoomsStrip'
import { FAQ } from './sections/FAQ'
import { Finale } from './sections/Finale'
import { CompanionSheet } from './sections/CompanionSheet'
import type { NewestRoom } from '@/lib/newest-rooms.functions'

export function HomeImmersive({ openRoomsCount = 0, newestRooms = [] }: { openRoomsCount?: number; newestRooms?: NewestRoom[] } = {}) {
  return (
    <>
      <EyeGradients />
      <HomeHeader />
      <main>
        <Hero openRoomsCount={openRoomsCount} newestRooms={newestRooms} />
        <div data-screen-label="Chapters" style={{ background: '#100c14', display: 'flex', flexDirection: 'column' }}>
          <div style={{ order: 2 }}><Chapter01Spill /></div>
          <div style={{ order: 1 }}><Chapter02Scan /></div>
          <div style={{ order: 3 }}><Chapter03Mirror /></div>
        </div>
        <RoomsStrip newestRooms={newestRooms} />
        <FAQ />
        <Finale />
      </main>
      <CompanionSheet />
    </>
  )
}
