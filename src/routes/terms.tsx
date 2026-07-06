import { createFileRoute } from '@tanstack/react-router'
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/terms`
const TITLE = 'Terms of Service — Shutap'
const DESCRIPTION =
  'The terms for using Shutap, a pseudonymous peer-support community with an AI companion. What Shutap is and isn\u2019t, your content, AI use, arbitration, and liability cap.'

export const Route = createFileRoute('/terms')({
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
  component: TermsPage,
})

function TermsPage() {
  return (
    <DocLayout
      active="/terms"
      title="terms of service"
      subline="the ground rules for using shutap. plain-language, but binding."
    >
      <p>
        <b>Effective July 1, 2026.</b> Operator: Shutap. These terms govern your use of Shutap, a
        pseudonymous peer-support community with an AI companion. In plain terms: shutap is a place
        to be heard — not a medical, mental-health, or legal service; you own what you write; the AI
        can be wrong; and you must be 18 or older.
      </p>

      <h3>what shutap is — and is not</h3>
      <p>
        Shutap is a pseudonymous peer-support and journaling community with an AI companion — a
        space to vent, reflect, and record what happened next. Shutap is <b>not</b> a healthcare,
        medical, mental-health, crisis, or legal service. Using it does not create a
        therapist–patient, physician–patient, attorney–client, or any other professional
        relationship. Nothing on shutap, including anything the AI says, is medical, psychological,
        or legal advice, diagnosis, or treatment.
      </p>

      <h3>emergencies</h3>
      <p>
        Shutap is not for emergencies. If you or someone else may be in danger, in the US call or
        text <a href="tel:988">988</a> or call 911. Anywhere,{' '}
        <a href="https://findahelpline.com" target="_blank" rel="noreferrer">findahelpline.com</a>.
        The companion routes you to these resources but cannot provide crisis intervention.
      </p>

      <h3>eligibility</h3>
      <p>You must be 18 or older. By using shutap you represent that you are 18+.</p>

      <h3>your account and pseudonym</h3>
      <p>
        You use shutap under a pseudonym; your real name is not displayed. Shutap is pseudonymous —
        not anonymous — and we do not guarantee anonymity against lawful legal process. We may
        disclose information where legally required. You are responsible for activity under your
        account.
      </p>

      <h3>your content</h3>
      <p>
        You own what you write. By posting, you grant shutap a non-exclusive, worldwide,
        royalty-free license to host, store, de-identify, display (where you make content public),
        and use de-identified content to operate and improve the service, including aggregated,
        de-identified insights. You represent your content is yours to share. Do not post
        others&apos; private or identifying information, or unlawful, infringing, harassing, or
        harmful content.
      </p>

      <h3>ai-generated content</h3>
      <p>
        Shutap&apos;s features are powered by AI. AI responses are generated automatically, may be
        inaccurate or inappropriate, and must not be relied upon for any decision. They are for
        reflection and support only, provided <b>&ldquo;as is&rdquo;</b>, and are not the advice of
        any professional.
      </p>

      <h3>acceptable use</h3>
      <p>You agree not to:</p>
      <ul>
        <li>post others&apos; personal or identifying information;</li>
        <li>harass, threaten, or abuse other members;</li>
        <li>post illegal content — and absolutely nothing sexual involving minors;</li>
        <li>impersonate anyone, spam, scrape, or misuse the service or its AI;</li>
        <li>attempt to de-anonymize other members;</li>
        <li>use shutap to provide professional services to others.</li>
      </ul>
      <p>We may remove content and suspend accounts that violate these terms.</p>

      <h3>reporting and takedown</h3>
      <p>
        Report content via in-product tools. We review reports and remove content that violates
        these terms or the law, and maintain a path for individuals to request removal of content
        about them (<a href="mailto:privacy@shutap.com">privacy@shutap.com</a>).
      </p>

      <h3>assumption of risk</h3>
      <p>
        Shutap involves user-generated emotional content and AI-generated responses that may be
        upsetting, inaccurate, or unhelpful. You use the service at your own risk.
      </p>

      <h3>disclaimers</h3>
      <p>
        The service is provided <b>&ldquo;as is&rdquo;</b> and <b>&ldquo;as available&rdquo;</b>,
        without warranties of any kind, express or implied, including fitness for a particular
        purpose or that AI output is accurate or reliable.
      </p>

      <h3>limitation of liability</h3>
      <p>
        To the maximum extent permitted by law, shutap and its operators are not liable for any
        indirect, incidental, special, consequential, or punitive damages, or for reliance on AI
        output or user content. <b>Total liability will not exceed the greater of amounts you paid
        shutap in the past 12 months or US$100.</b> Some jurisdictions do not allow certain
        limitations, so parts may not apply to you.
      </p>

      <h3>indemnification</h3>
      <p>
        You agree to indemnify shutap against claims arising from your content or your violation
        of these terms.
      </p>

      <h3>termination</h3>
      <p>You may delete your account anytime. We may suspend or terminate access for violations.</p>

      <h3>governing law &amp; dispute resolution</h3>
      <p>
        These terms are governed by the laws of the State of Delaware, USA, without regard to
        conflict-of-laws rules. Before filing anything, you and shutap agree to try to resolve any
        dispute informally by writing to <a href="mailto:legal@shutap.com">legal@shutap.com</a>
        {' '}and giving us 30 days to respond. If we can&apos;t resolve it, disputes will be
        resolved by <b>binding individual arbitration</b> — not in court and not as a class or
        representative action. <b>You and shutap each waive the right to a jury trial and to
        participate in a class action.</b> Small-claims court claims are excluded from this
        arbitration commitment.
      </p>

      <h3>subscriptions &amp; billing</h3>
      <p>
        Mirror is a paid subscription at the prices shown at checkout. New subscriptions include a
        <b> 14-day free trial</b> that requires a valid payment method up front; at the end of the
        trial the subscription <b>converts automatically</b> to a paid subscription and your card is
        charged unless you cancel before the trial ends. Subscriptions <b>renew automatically</b> at
        the end of each billing period (monthly or annual) at the then-current price for your plan.
        You can <b>cancel anytime</b> from the billing portal linked in your profile; cancellation
        takes effect at the <b>end of your current billing period</b> and you keep access until
        then. Amounts already paid for the current or any past billing periods are
        <b> non-refundable</b>, except where a refund is required by applicable law.
        &ldquo;Founders&apos; pricing&rdquo; is honored for as long as your subscription remains
        continuously active; if it lapses or is canceled, resubscribing may be at the then-current
        standard price.
      </p>

      <h3>changes</h3>
      <p>
        We may update these terms; material changes will be notified and re-accepted with a new
        version date.
      </p>

      <h3>contact</h3>
      <p>
        Questions about these terms: <a href="mailto:legal@shutap.com">legal@shutap.com</a>.
      </p>
    </DocLayout>
  )
}
