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
      ...ogImageMeta(),
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
      title="Community Guidelines"
      subline="the short version, in our own voice"
    >
      <div
        style={{
          background: '#fff',
          border: '.5px solid rgba(11,8,15,.08)',
          borderRadius: 18,
          padding: '22px 24px',
          marginTop: 18,
        }}
      >
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>this is a place to be heard. be real, be kind to each other.</li>
          <li>
            <b>don&rsquo;t post other people&rsquo;s private info</b> — names, addresses, anything
            that could identify someone. (we scrub a lot of this automatically, but don&rsquo;t
            try.)
          </li>
          <li>no harassment, threats, hate, or cruelty aimed at people.</li>
          <li>nothing illegal — and absolutely nothing sexual involving minors.</li>
          <li>don&rsquo;t impersonate, spam, or scrape.</li>
          <li>don&rsquo;t use shutap to sell services or give professional advice to others.</li>
          <li>
            see something that breaks this? <b>report it</b> — there&rsquo;s a button on every
            post.
          </li>
        </ul>
      </div>
      <p style={{ marginTop: 16 }}>We remove content and accounts that break these rules.</p>
    </DocLayout>
  )
}
