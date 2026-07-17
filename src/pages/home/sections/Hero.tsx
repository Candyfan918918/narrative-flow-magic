/* Section: Hero — byte-for-byte port of /tmp/bundle/template.html.  
 * Every data-* hook preserved verbatim so mountImmersive drives interactivity. */
export function Hero({ openRoomsCount = 0 }: { openRoomsCount?: number } = {}) {
  const showLive = openRoomsCount > 0
  return (
    <>
            {/* ══ HERO ══ */}
            <section data-screen-label="Hero" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', padding: 'clamp(76px,10vh,110px) clamp(18px,4vw,30px) 0', scrollSnapAlign: 'start' }}>
              {' '}
              <div style={{ position: 'absolute', inset: '-30% -10% auto', height: '90vh', background: 'radial-gradient(ellipse at 50% 40%,rgba(231,84,138,.13),transparent 60%)', pointerEvents: 'none' }}>
              </div>
              {' '}
              <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                <div data-heroinner="" style={{ maxWidth: '1560px', margin: '0 auto', width: '100%', position: 'relative', willChange: 'transform,opacity' }}>
                  {' '}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(18px,3vh,40px)' }}>
                    {' '}
                    <span data-heroeyes="" style={{ width: 'clamp(110px,min(20vw,20vh),270px)', display: 'block' }}>
                      {' '}
                      <span style={{ display: 'block', animation: 'eblink 4.6s infinite', transformOrigin: 'center' }}>
                        {' '}
                        <svg viewBox="0 0 140 96" fill="none" style={{ display: 'block', width: '100%', height: 'auto', filter: 'drop-shadow(0 24px 48px rgba(193,33,107,.35))' }}>
                          {' '}
                          <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)" />
                          {' '}
                          <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)" />
                          {' '}
                          <ellipse data-pup="" cx="44" cy="62" rx="19" ry="24" fill="url(#pupG2)" />
                          {' '}
                          <ellipse data-pup="" cx="112" cy="62" rx="19" ry="24" fill="url(#pupG2)" />
                          {' '}
                          <path d="M44 22 C41 18 35 18 35 24 C35 30 44 36 44 36 C44 36 53 30 53 24 C53 18 47 18 44 22Z" fill="#fff" opacity=".95" />
                          {' '}
                          <path d="M112 22 C109 18 103 18 103 24 C103 30 112 36 112 36 C112 36 121 30 121 24 C121 18 115 18 112 22Z" fill="#fff" opacity=".95" />
                          {' '}
                        </svg>
                        {' '}
                      </span>
                      {' '}
                    </span>
                    {' '}
                  </div>
                  {' '}
                  <h1 data-heroh1="" style={{ fontFamily: '\'Sora\',sans-serif', fontWeight: '800', fontSize: 'clamp(36px,min(7vw,9.5vh),96px)', lineHeight: '1', letterSpacing: '-.045em', margin: '0', color: '#0b080f', textAlign: 'center', willChange: 'transform' }}>
                    {' '}
                    <span style={{ display: 'block' }}>
                      {' '}
                      <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
                        <span data-wr="" style={{ display: 'inline-block' }}>
                          finally,
                        </span>
                      </span>
                      {' '}
                      <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
                        <span data-wr="" style={{ display: 'inline-block' }}>
                          somewhere
                        </span>
                      </span>
                      {' '}
                      <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
                        <span data-wr="" style={{ display: 'inline-block' }}>
                          to
                        </span>
                      </span>
                      {' '}
                    </span>
                    {' '}
                    <span style={{ display: 'block', overflow: 'hidden' }}>
                      <span data-wr="" style={{ display: 'inline-block', fontFamily: '\'Newsreader\',serif', fontStyle: 'italic', fontWeight: '400', letterSpacing: '-.02em', background: 'linear-gradient(92deg,#e7548a,#890041 70%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', padding: '0 .06em .08em' }}>
                        not shut up.
                      </span>
                    </span>
                    {' '}
                  </h1>
                  {' '}
                  <div data-rv="zoom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(14px,2.6vh,26px)', marginTop: 'clamp(18px,3.4vh,44px)' }}>
                    {' '}
                    <p style={{ fontFamily: '\'Newsreader\',serif', fontStyle: 'italic', fontSize: 'clamp(17px,1.6vw,21px)', lineHeight: '1.55', color: '#4a3040', maxWidth: '44ch', margin: '0', textAlign: 'center' }}>
                      some things you just need to say out loud — and you're not the only one who's been through this. spill it; someone in here has lived your exact thing.
                    </p>
                    {' '}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {' '}
                      <a href="#scan" data-cta="scan" data-hover="" data-mag="" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontFamily: '\'Sora\',sans-serif', fontWeight: '700', fontSize: '16px', color: '#fff', background: 'linear-gradient(155deg,#ff7eb3,#e7548a 55%,#c1216b)', borderRadius: '999px', padding: '18px 34px', boxShadow: '0 16px 36px -14px rgba(193,33,107,.6)' }}>
                        scan it 
                        <span style={{ fontWeight: '400' }}>
                          →
                        </span>
                      </a>
                      {' '}
                      <a href="#spill" data-cta="spill" data-hover="" data-mag="" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontFamily: '\'Sora\',sans-serif', fontWeight: '700', fontSize: '16px', color: '#c1216b', background: '#fff', border: '1.5px solid rgba(231,84,138,.35)', borderRadius: '999px', padding: '18px 34px', transition: 'border-color .3s, background .3s' }}>
                        spill it
                      </a>
                      {' '}
                    </div>
                    {' '}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: '\'Sora\',sans-serif', fontWeight: '600', fontSize: '11px', letterSpacing: '.2em', textTransform: 'uppercase', color: '#a01a55' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#e7548a', animation: 'breathe 2.8s ease-in-out infinite', display: 'block' }}>
                      </span>
                      <span data-livecount="">
                        31
                      </span>
                      {'\u00A0'}
                      rooms open now
                    </div>
                    {' '}
                  </div>
                  {' '}
                </div>
              </div>
              {' '}
              <div className="home-hero-scrollcue" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#6b4a5c', paddingBottom: 'clamp(26px,4vh,40px)', marginTop: 'clamp(40px,6vh,80px)' }}>
                {' '}
                <span style={{ fontFamily: '\'Newsreader\',serif', fontStyle: 'italic', fontSize: '13px' }}>
                  scroll
                </span>
                {' '}
                <span style={{ display: 'block', width: '1.5px', height: '34px', background: 'linear-gradient(#e7548a,transparent)', animation: 'scrollHint 1.8s ease-in-out infinite' }}>
                </span>
                {' '}
              </div>
            </section>
    </>
  )
}
