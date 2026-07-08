/* Section: EyeGradients — byte-for-byte port of /tmp/bundle/template.html.  
 * Every data-* hook preserved verbatim so mountImmersive drives interactivity. */
export function EyeGradients() {
  return (
    <>
            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
              <defs>
                {' '}
                <radialGradient id="eyeG2" cx="40%" cy="18%" r="75%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="18%" stopColor="#ffd0e8" />
                  <stop offset="48%" stopColor="#f060a0" />
                  <stop offset="78%" stopColor="#c0206a" />
                  <stop offset="100%" stopColor="#880040" />
                </radialGradient>
                {' '}
                <radialGradient id="pupG2" cx="50%" cy="55%" r="58%">
                  <stop offset="0%" stopColor="#3a1020" />
                  <stop offset="100%" stopColor="#060106" />
                </radialGradient>
              </defs>
            </svg>
    </>
  )
}
