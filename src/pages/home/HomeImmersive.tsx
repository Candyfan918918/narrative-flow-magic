/* HomeImmersive — Pass 2: fully native React composition of `/`. Every
 * section under /tmp/bundle/template.html is now a JSX component; the
 * RestInjector bridge and IMMERSIVE_REST_HTML template are gone. All
 * data-* hooks preserved so mountImmersive drives interactivity unchanged. */
import { EyeGradients } from './sections/EyeGradients'
import { Preloader } from './sections/Preloader'
import { HomeHeader } from './sections/Header'
import { Hero } from './sections/Hero'
import { Chapter01Spill } from './sections/Chapter01Spill'
import { Chapter02Scan } from './sections/Chapter02Scan'
import { Chapter03Mirror } from './sections/Chapter03Mirror'
import { RoomsStrip } from './sections/RoomsStrip'
import { FAQ } from './sections/FAQ'
import { Finale } from './sections/Finale'
import { CompanionSheet } from './sections/CompanionSheet'

export function HomeImmersive() {
  return (
    <>
      <EyeGradients />
      <Preloader />
      <HomeHeader />
      <main>
        <Hero />
        <div data-screen-label="Chapters" style={{ background: '#100c14' }}>
          <Chapter01Spill />
          <Chapter02Scan />
          <Chapter03Mirror />
        </div>
        <RoomsStrip />
        <FAQ />
        <Finale />
      </main>
      <CompanionSheet />
    </>
  )
}
