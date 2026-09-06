// FAQ block — 4 native-details accordions with the exact copy specified.
// Emits FAQPage JSON-LD in a <script> so search engines index it.
const NEWS = "'Newsreader',Georgia,serif"
const SORA = "'Sora',system-ui,sans-serif"

export const HOME_FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'what is shutap?',
    a: "you type what happened — the comment at dinner, the text at 11pm, the meeting you weren't invited to — and shutap writes you a set of joke cards. every card is a different angle on the same mess. you flip them one at a time and keep the ones that land.",
  },
  {
    q: 'is this pseudonymous?',
    a: 'you get a name. something like Feral Norwegian Heron. it sticks, and it is not yours. names, addresses, workplaces and anything else identifying get stripped before a word is stored.',
  },
  {
    q: 'is this therapy or advice?',
    a: "no. shutap writes jokes, not prescriptions. it doesn't diagnose you, prescribe anything, or tell you what to do. if something is genuinely heavy, it stops joking and points you at real help.",
  },
  {
    q: 'what can i bring here?',
    a: "family, partners, exes, roommates, managers, landlords, the friend who's been doing the thing for nine years, the stranger who felt like commenting. big things and extremely small ones. if it's still in your head at midnight, it's material.",
  },
]


export function HomeFAQ({ onOpenSpill, onOpenScan }: { onOpenSpill: () => void; onOpenScan: () => void }) {
  return (
    <section style={{ position: 'relative', background: '#ffffff', padding: 'clamp(46px,7vh,80px) 22px clamp(36px,5vh,60px)' }}>
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <div style={{ fontFamily: SORA, fontWeight: 700, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: '#a52a5f', marginBottom: 14 }}>
          what is shutap
        </div>
        <h2 style={{ fontFamily: SORA, fontWeight: 800, fontSize: 'clamp(26px,3.4vw,44px)', letterSpacing: '-.03em', lineHeight: 1.08, margin: '0 0 16px', color: '#0b080f' }}>
          questions, <em style={{ fontFamily: NEWS, fontStyle: 'italic', color: '#c1216b', fontWeight: 400 }}>answered.</em>
        </h2>
        <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 17, color: '#100c14', lineHeight: 1.65, margin: '0 0 10px', maxWidth: '52ch' }}>
          you have the material. shutap does the writing part — jokes about the situation, never about you. pseudonymous, 18+.
        </p>
        <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 15.5, color: '#443c42', lineHeight: 1.65, margin: '0 0 24px', maxWidth: '52ch' }}>
          <span onClick={onOpenSpill} style={{ color: '#c1216b', cursor: 'pointer' }}>say the thing</span> — write it out under a pseudonym. or{' '}
          <span onClick={onOpenScan} style={{ color: '#c1216b', cursor: 'pointer' }}>scan it</span> — answer a few questions nobody thinks to ask and the story gets sharper.
        </p>


        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {HOME_FAQ.map((f, i) => (
            <details
              key={f.q}
              style={{
                borderTop: '.5px solid rgba(11,8,15,.08)',
                borderBottom: i === HOME_FAQ.length - 1 ? '.5px solid rgba(11,8,15,.08)' : undefined,
                padding: '15px 0',
              }}
            >
              <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', listStyle: 'none', fontFamily: SORA, fontWeight: 600, fontSize: 14, color: '#0b080f' }}>
                <span>{f.q}</span>
                <span aria-hidden style={{ color: '#a52a5f', fontSize: 20, fontWeight: 300 }}>+</span>
              </summary>
              <p style={{ marginTop: 10, fontFamily: NEWS, fontStyle: 'italic', fontSize: 15, color: '#443c42', lineHeight: 1.6, maxWidth: '52ch' }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
