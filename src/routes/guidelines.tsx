import { createFileRoute } from '@tanstack/react-router'
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/guidelines`
const TITLE = 'Community Guidelines — Shutap'
const DESCRIPTION =
  'How to keep shutap a safe place to be honest: protect privacy, aim any sharpness at situations not people, and never post anything that harms someone.'

export const Route = createFileRoute('/guidelines')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: URL },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: URL }],
  }),
  component: GuidelinesPage,
})

function GuidelinesPage() {
  return (
    <DocLayout
      active="/guidelines"
      title="community guidelines"
      subline="short, in-voice. be real, be kind, protect each other."
    >
      <div
        style={{
          background: '#fff',
          border: '.5px solid rgba(11,8,15,.08)',
          borderRadius: 18,
          padding: '22px 24px',
          boxShadow: '0 12px 30px -24px rgba(80,10,45,.3)',
        }}
      >
        <h3 style={{ marginTop: 0 }}>be real. be kind.</h3>
        <p>
          shutap works because people can be honest here without being exposed or attacked. keep it
          real, aim any edge at the <b>situation</b>, not the person who shared it.
        </p>

        <h3>don&apos;t post other people&apos;s private info.</h3>
        <p>
          no real names, addresses, workplaces, phone numbers, screenshots with identifying detail —
          about anyone, including yourself. write about your experience, not their identity.
        </p>

        <h3>no harassment, no hate.</h3>
        <p>no threats, no slurs, no pile-ons, no dogpiling on someone who shared.</p>

        <h3>nothing illegal.</h3>
        <p>
          and <b>absolutely nothing sexual involving minors</b> — ever. content or accounts here
          are removed and reported.
        </p>

        <h3>no impersonation, spam, or scraping.</h3>
        <p>
          be who you say you are (under your alias). don&apos;t pretend to be someone else.
          don&apos;t scrape the site, the companion, or other people&apos;s stories.
        </p>

        <h3>don&apos;t sell services or hand out professional advice.</h3>
        <p>
          share <b>your own</b> experience. do not pose as a therapist, doctor, or lawyer, or
          instruct anyone else what to do medically, legally, or financially.
        </p>

        <h3>report anything that breaks this.</h3>
        <p>use the report tools in the room or on a comment — a real person reviews every report.</p>

        <p style={{ marginTop: 22 }}>
          <b>We remove content and accounts that break these rules.</b>
        </p>
      </div>
    </DocLayout>
  )
}
