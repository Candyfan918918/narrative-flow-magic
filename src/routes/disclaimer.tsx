import { createFileRoute } from '@tanstack/react-router'
import { ogImageMeta } from "@/lib/seo/meta";
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/disclaimer`
const TITLE = 'Medical / Legal Disclaimer — Shutap'
const DESCRIPTION =
  'Shutap is a peer-support and journaling community with an AI companion. It does not provide medical, mental-health, crisis, or legal services or advice.'

export const Route = createFileRoute('/disclaimer')({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: URL },
      ...ogImageMeta(),
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
    ],
    links: [{ rel: 'canonical', href: URL }],
  }),
  component: DisclaimerPage,
})

function DisclaimerPage() {
  return (
    <DocLayout
      active="/disclaimer"
      title="Medical / Legal Disclaimer"
      subline="formal + in-voice"
    >
      <h3>Formal</h3>
      <p>
        Shutap is a peer-support and journaling community with an AI companion. It does not provide
        medical, psychological, mental-health, crisis, or legal services or advice, and no
        professional relationship is created by using it. Content and AI responses are for support
        and reflection only and are not a substitute for professional care. In an emergency,
        contact 988 or 911 (US) or findahelpline.com.
      </p>

      <h3>In-voice</h3>
      <div
        style={{
          background: '#fff',
          border: '.5px solid rgba(11,8,15,.08)',
          borderRadius: 14,
          padding: '16px 18px',
          fontFamily: 'Newsreader,serif',
          fontStyle: 'italic',
          fontSize: 15.5,
          color: '#3a2630',
          lineHeight: 1.55,
        }}
      >
        &ldquo;shutap is your group chat, not your therapist. we&rsquo;re here to listen, not to
        treat. if it&rsquo;s heavy, here&rsquo;s real help →&rdquo;
      </div>
    </DocLayout>
  )
}
