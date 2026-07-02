import { createFileRoute } from '@tanstack/react-router'
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/ai-disclosure`
const TITLE = 'AI Disclosure — Shutap'
const DESCRIPTION =
  'What the AI on shutap does, what it isn\u2019t, that it can be wrong, and which models we use — Google Gemini via the Lovable AI Gateway, no training on your content.'

export const Route = createFileRoute('/ai-disclosure')({
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
  component: AiDisclosurePage,
})

function AiDisclosurePage() {
  return (
    <DocLayout
      active="/ai-disclosure"
      title="ai disclosure"
      subline="what the ai does. what it isn\u2019t. which model. and that it can be wrong."
    >
      <h3>what the ai does</h3>
      <p>
        the companion helps you find the words for what you&apos;re feeling, reflects your story
        back to you, and powers the Mirror&apos;s view of your patterns over time. the stories are
        yours; the ai guides — it doesn&apos;t author them for you.
      </p>

      <h3>what the ai is not</h3>
      <p>
        the ai is not a human, a therapist, a doctor, or a lawyer, and never claims to be. it
        cannot give medical, psychological, or legal advice, diagnosis, or treatment.
      </p>

      <h3>it can be wrong</h3>
      <p>
        ai responses are generated automatically and can be inaccurate, incomplete, or off-base.
        use your own judgment; don&apos;t rely on ai output for important decisions.
      </p>

      <h3>which ai we use</h3>
      <p>
        companion, spill, scan, and Mirror responses are generated using <b>Google&apos;s Gemini
        models via the Lovable AI Gateway</b>. under the gateway&apos;s commercial terms, <b>your
        content is not used to train the underlying models.</b> see the{' '}
        <a href="/privacy">privacy policy</a> for how your data is handled.
      </p>

      <h3>crisis handling</h3>
      <p>
        if something serious comes up, the ai stops and points you to real human help rather than
        trying to handle it itself. see <a href="/safety">crisis &amp; safety</a>.
      </p>
    </DocLayout>
  )
}
