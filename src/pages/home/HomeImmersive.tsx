/* HomeImmersive — Pass 1 native React composition of `/`.
 * Preloader / Header / Hero / Chapter 01-03 are byte-for-byte JSX ports of
 * /tmp/bundle/template.html; rooms strip → companion sheet still injected
 * via <RestInjector /> during the sanctioned one-turn bridge (deleted in
 * Pass 2). Every data-* hook is preserved so mountImmersive drives all
 * interactivity untouched. */
import { EyeGradients } from './sections/EyeGradients'
import { Preloader } from './sections/Preloader'
import { HomeHeader } from './sections/Header'
import { Hero } from './sections/Hero'
import { Chapter01Spill } from './sections/Chapter01Spill'
import { Chapter02Scan } from './sections/Chapter02Scan'
import { Chapter03Mirror } from './sections/Chapter03Mirror'
import { RestInjector } from './sections/RestInjector'

export function HomeImmersive({ restHtml }: { restHtml: string }) {
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
        <RestInjector innerHTML={restHtml} />
      </main>
    </>
  )
}
