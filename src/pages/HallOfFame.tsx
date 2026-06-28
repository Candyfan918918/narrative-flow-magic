/* Hall of Fame — real React placeholder. Previously iframe. */
import { Link } from 'react-router-dom'
import { Header } from '@/components/Header'

export function HallOfFamePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf0f5' }}>
      <Header />
      <main style={{ maxWidth: 740, margin: '0 auto', padding: '36px 22px 80px' }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 12, letterSpacing: '.18em', color: '#9e7a8c' }}>HALLS</div>
        <h1 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 28, margin: '6px 0 6px' }}>the halls are forming.</h1>
        <p style={{ fontFamily: 'Newsreader,serif', fontStyle: 'italic', color: '#4a3040' }}>
          when enough people pour into the same shape, a hall lights up: healing · brave · relatable · loving. wander the <Link to="/stream" style={{ color: '#c1216b' }}>rooms</Link> in the meantime.
        </p>
      </main>
    </div>
  )
}
