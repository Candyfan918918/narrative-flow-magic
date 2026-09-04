// FAQ block — 4 native-details accordions with the exact copy specified.
// Emits FAQPage JSON-LD in a <script> so search engines index it.
const NEWS = "'Newsreader',Georgia,serif"
const SORA = "'Sora',system-ui,sans-serif"

export const HOME_FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'is this anonymous?',
    a: "pseudonymous. you get a persistent alias — something like 🦉 Quiet Indonesian Owl — and your real name, email, and identity stay permanently outside. that persistence is what lets someone remember your last spill and sit with your next one.",
  },
  {
    q: 'what happens when i vent?',
    a: 'you open a room. one at a time, the companion helps you find the words. when it feels ready, the room goes into the stream, other people who\u2019ve lived your exact thing show up, relate, and — if you asked for it — tell you what actually happened next.',
  },
  {
    q: 'what does the companion do?',
    a: 'the companion is an AI that listens, helps you spill without freezing, scrubs names and details before anything is seen, and reflects patterns back to you over time. it is not a therapist and not a friend — it is the thing in the room with you at 3am.',
  },
  {
    q: 'what happens after i share?',
    a: "the room opens. people sit in — some just to be with you, some to say \u201comg same,\u201d some to share how theirs went. over the next days the companion checks in: what happened next? that\u2019s your mirror starting to form.",
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
          a pseudonymous place to vent about relationships, marriage, family, and work — and see what actually happened next for people who lived your exact thing.
        </p>
        <p style={{ fontFamily: NEWS, fontStyle: 'italic', fontSize: 15.5, color: '#443c42', lineHeight: 1.65, margin: '0 0 24px', maxWidth: '52ch' }}>
          <span onClick={onOpenSpill} style={{ color: '#c1216b', cursor: 'pointer' }}>spill it</span> — one question at a time, the companion helps you find the words. or{' '}
          <span onClick={onOpenScan} style={{ color: '#c1216b', cursor: 'pointer' }}>scan it</span> — sixty seconds of questions, a private read saved just for you.
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
