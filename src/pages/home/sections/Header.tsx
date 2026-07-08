/* Section: HomeHeader — byte-for-byte port of /tmp/bundle/template.html.  
 * Every data-* hook preserved verbatim so mountImmersive drives interactivity. */
export function HomeHeader() {
  return (
    <>
            {/* ══ HEADER ══ */}
            <header data-hdr="" style={{ position: 'fixed', top: '0', left: '0', right: '0', zIndex: '50', transition: 'background .35s,backdrop-filter .35s,box-shadow .35s' }}>
              <div style={{ maxWidth: '1560px', margin: '0 auto', padding: '20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <a href="/" data-link="/" data-hover="" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit' }}>
                  <span style={{ width: '34px', height: '24px', display: 'block', animation: 'eblink 3.4s infinite', transformOrigin: 'center' }}>
                    <svg viewBox="0 0 140 96" fill="none" style={{ display: 'block', width: '100%', height: '100%' }}>
                      <rect x="16" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)" />
                      <rect x="84" y="6" width="56" height="84" rx="28" fill="url(#eyeG2)" />
                      <ellipse cx="44" cy="62" rx="19" ry="24" fill="url(#pupG2)" />
                      <ellipse cx="112" cy="62" rx="19" ry="24" fill="url(#pupG2)" />
                    </svg>
                  </span>
                  <span data-brandword="" style={{ fontFamily: '\'Sora\',sans-serif', fontWeight: '800', fontSize: '20px', letterSpacing: '-.04em', color: '#0b080f', transition: 'color .4s' }}>
                    shut
                    <span style={{ color: '#e7548a' }}>
                      ap
                    </span>
                  </span>
                </a>
                <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a href="/stream" data-link="/stream" data-hover="" data-navlink="" style={{ fontFamily: '\'Newsreader\',serif', fontStyle: 'italic', fontSize: '15px', color: '#6b4a5c', padding: '8px 14px', transition: 'color .4s' }}>
                    rooms
                  </a>
                  <a href="/halls" data-link="/halls" data-hover="" data-navlink="" style={{ fontFamily: '\'Newsreader\',serif', fontStyle: 'italic', fontSize: '15px', color: '#6b4a5c', padding: '8px 14px', transition: 'color .4s' }}>
                    halls
                  </a>
                  <a href="/welcome" data-link="/welcome" data-hover="" data-mag="" style={{ display: 'inline-block', fontFamily: '\'Sora\',sans-serif', fontWeight: '700', fontSize: '13px', color: '#fff', background: '#0b080f', borderRadius: '999px', padding: '11px 22px', transition: 'background .3s' }}>
                    join →
                  </a>
                </nav>
              </div>
            </header>
    </>
  )
}
