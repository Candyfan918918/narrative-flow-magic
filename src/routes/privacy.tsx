import { createFileRoute } from '@tanstack/react-router'
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/privacy`
const TITLE = 'Privacy Policy — Shutap'
const DESCRIPTION =
  'How shutap protects your privacy: pseudonymous by design, identifiers scrubbed before storage, AI processing via the Lovable AI Gateway with no training on your content, and full data rights.'

export const Route = createFileRoute('/privacy')({
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
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <DocLayout
      active="/privacy"
      title="privacy policy"
      subline={"pseudonymous by design. your content is scrubbed of identifiers before it\u2019s stored."}
    >
      <p>
        <b>Effective July 1, 2026.</b> Controller: Shutap. Contact:{' '}
        <a href="mailto:privacy@shutap.com">privacy@shutap.com</a>. The short version: shutap is
        pseudonymous by design, an automatic Scrubber removes personal identifiers before anything
        is stored, we keep only the scrubbed version, we do not sell your personal information, and
        you can access, export, or delete your data at any time.
      </p>

      <h3>our approach</h3>
      <p>
        Shutap is built to be pseudonymous and privacy-protective. You write under a pseudonym, and
        our Scrubber automatically removes personal identifiers (names, addresses, specific
        locations, phone numbers, emails) before storage — we keep only the scrubbed version.
      </p>

      <h3>what we collect</h3>
      <ul>
        <li><b>Account:</b> a pseudonym, your email (sign-in and check-ins), timezone, notification preferences, consent records.</li>
        <li><b>Content:</b> your stories, spills, scans, and check-in responses — stored only in scrubbed form.</li>
        <li><b>Usage:</b> product analytics via PostHog, tied to a pseudonymous ID.</li>
        <li><b>Device/technical:</b> standard log and device data.</li>
      </ul>

      <h3>how we use it</h3>
      <p>
        To run the community and companion; deliver check-ins; provide the Mirror (your patterns
        over time, for subscribers); produce aggregated, de-identified insights; keep the service
        safe; and comply with law. <b>We do not sell your personal information.</b>
      </p>

      <h3>ai processing</h3>
      <p>
        Your messages are processed by <b>Google&apos;s Gemini models via the Lovable AI Gateway</b>
        {' '}to generate companion responses, Mirror readings, and safety checks. Under the
        gateway&apos;s commercial terms, <b>your content is not used to train the underlying
        models.</b> AI processing happens only to provide these features to you.
      </p>

      <h3>subprocessors</h3>
      <ul>
        <li><b>Lovable / Supabase</b> — database, auth, storage, and hosting.</li>
        <li><b>Lovable AI Gateway (Google Gemini)</b> — AI responses for the companion and Mirror.</li>
        <li><b>Resend</b> — email delivery for sign-in and check-ins.</li>
        <li><b>PostHog</b> — pseudonymous product analytics.</li>
      </ul>
      <p>Each processes data only to provide their service to shutap.</p>

      <h3>legal &amp; safety disclosure</h3>
      <p>
        We may disclose information where required by law or to prevent imminent harm.
        Crisis-flagged content is kept private, excluded from public display and our aggregated
        corpus, and is never sold or monetized.
      </p>

      <h3>retention</h3>
      <p>
        We keep your data while your account is active and as needed for the purposes above; you
        can delete your content or account at any time.
      </p>

      <h3>security</h3>
      <p>
        We use reasonable technical and organizational measures to protect your data. No system is
        perfectly secure. In a breach affecting your personal data, we will notify you and the
        authorities as required by law.
      </p>

      <h3>your rights</h3>
      <p>
        Depending on where you live (including under GDPR and California&apos;s CCPA/CPRA), you may
        have the right to access, correct, delete, export, object to, or restrict processing, and
        to withdraw consent. Delete your stories and account, or request an export, from
        <b> Account &amp; Data</b> settings or via{' '}
        <a href="mailto:privacy@shutap.com">privacy@shutap.com</a>. <b>We do not sell personal
        information.</b> We will not discriminate against you for exercising these rights. We honor
        verified requests within 30 days.
      </p>

      <h3>children</h3>
      <p>
        Shutap is for adults 18+. We do not knowingly collect data from anyone under 18; if we
        learn we have, we delete it.
      </p>

      <h3>international users and transfers</h3>
      <p>
        Shutap is operated from the United States. If you access it from outside the US, your data
        is processed in the US. Where required for EU or UK users, we rely on appropriate
        safeguards (such as Standard Contractual Clauses) with our providers.
      </p>

      <h3>cookies</h3>
      <p>
        We use essential cookies to run the service and privacy-preserving analytics (PostHog). We
        do not use advertising cookies. In the EU and UK we show a consent banner and default to
        declining non-essential cookies.
      </p>

      <h3>changes &amp; contact</h3>
      <p>
        Material changes to this policy will be notified in-product. Questions or requests:{' '}
        <a href="mailto:privacy@shutap.com">privacy@shutap.com</a>.
      </p>
    </DocLayout>
  )
}
