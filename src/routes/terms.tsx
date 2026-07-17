import { createFileRoute } from '@tanstack/react-router'
import { ogImageMeta } from "@/lib/seo/meta";
import { DocLayout } from '@/components/site/DocLayout'
import { SITE_URL } from '@/lib/site'

const URL = `${SITE_URL}/terms`
const TITLE = 'Terms of Service — Shutap'
const DESCRIPTION =
  'Terms for using Shutap, a pseudonymous peer-support community with an AI companion — what Shutap is and isn\u2019t, your content, AI use, and liability.'

export const Route = createFileRoute('/terms')({
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
  component: TermsPage,
})

function TermsPage() {
  return (
    <DocLayout
      active="/terms"
      title="Terms of Service"
      subline="Effective: July 1, 2026 · Operator: Shutap"
    >
      <h3>1. What Shutap is — and is not.</h3>
      <p>
        Shutap is a pseudonymous peer-support and journaling community with an AI companion. It is
        a space to vent, to feel less alone, and to record what happened next.{' '}
        <b>Shutap is not a healthcare, medical, mental-health, crisis, or legal service.</b> Using
        Shutap does not create a therapist–patient, physician–patient, attorney–client, or any
        other professional relationship. Nothing on Shutap — including anything our AI companion or
        the &ldquo;Mirror&rdquo; says — is medical, psychological, or legal advice, diagnosis, or
        treatment. Do not use Shutap as a substitute for professional care.
      </p>

      <h3>2. Emergencies.</h3>
      <p>
        Shutap is not for emergencies. If you or someone else may be in danger or crisis, contact
        emergency services (in the US, call or text <b>988</b> or call <b>911</b>) or the resources
        at findahelpline.com. Our companion will route you to these resources, but it cannot and
        does not provide crisis intervention.
      </p>

      <h3>3. Eligibility.</h3>
      <p>
        You must be <b>18 or older</b> to use Shutap. By using it you represent that you are 18+.
      </p>

      <h3>4. Your account and pseudonym.</h3>
      <p>
        You use Shutap under a pseudonym; your real name is not displayed. We do not guarantee
        anonymity against lawful legal process (e.g., a valid subpoena) and may disclose information
        where legally required (see Privacy Policy). You are responsible for activity under your
        account.
      </p>

      <h3>5. Your content.</h3>
      <p>
        You own what you write. By posting, you grant us a non-exclusive, worldwide, royalty-free
        license to host, store, de-identify, display (where you choose to make content public), and
        use de-identified content to operate and improve the service, including aggregated,
        de-identified insights. You represent that your content is yours to share and does not
        violate anyone&rsquo;s rights.{' '}
        <b>
          Do not post other people&rsquo;s private or identifying information; do not post unlawful,
          infringing, harassing, or harmful content
        </b>{' '}
        (see Community Guidelines).
      </p>

      <h3>6. AI-generated content.</h3>
      <p>
        Shutap&rsquo;s companion and Mirror are powered by artificial intelligence. AI responses
        are generated automatically,{' '}
        <b>may be inaccurate, incomplete, or inappropriate, and must not be relied upon</b> for any
        decision. They are for reflection and support only, are provided &ldquo;as is,&rdquo; and
        are not the advice of any professional. You use AI features at your own discretion and risk.
      </p>

      <h3>7. Acceptable use.</h3>
      <p>
        You agree not to: post others&rsquo; personal/identifying information; harass, threaten, or
        abuse; post illegal content (including any sexual content involving minors); impersonate;
        spam; scrape or misuse the service or its AI; attempt to de-anonymize other users; or use
        Shutap to provide professional services to others. We may remove content and suspend
        accounts that violate these terms.
      </p>

      <h3>8. Reporting and takedown.</h3>
      <p>
        You can report content via the in-product report tools. We review reports and remove content
        that violates these terms or the law, and we maintain a path for individuals to request
        removal of content about them.
      </p>

      <h3 id="refunds">9. Subscriptions, billing &amp; refunds.</h3>
      <p>
        Some features (the &ldquo;Mirror&rdquo;) require a paid subscription. Paid subscriptions
        begin with a free trial; your payment method is collected up front and{' '}
        <b>the first charge happens automatically when the trial ends</b> unless you cancel first.
        Subscriptions renew automatically each billing period at the price shown at checkout (plus
        any applicable taxes) until cancelled. You can cancel anytime from your profile or the
        billing portal; cancellation takes effect at the end of the current billing period, and you
        keep access until then. <b>Payments already made — for the current or past periods — are
        not refunded</b>, except where a refund is required by applicable law. Venting, scanning,
        and being heard remain free.
      </p>

      <h3>10. Assumption of risk.</h3>
      <p>
        Shutap involves user-generated emotional content and AI-generated responses. You understand
        and accept that such content may be upsetting, inaccurate, or unhelpful, and you use the
        service at your own risk.
      </p>

      <h3>11. Disclaimers.</h3>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
        warranties of any kind, express or implied, including fitness for a particular purpose and
        any warranty that the service or AI output is accurate, reliable, or suitable for your
        needs.
      </p>

      <h3>12. Limitation of liability.</h3>
      <p>
        To the maximum extent permitted by law, Shutap and its operators will not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or for any reliance on
        AI output or user content; and our total liability will not exceed the greater of the
        amounts you paid us in the past 12 months or <b>US$100</b>.
      </p>

      <h3>13. Indemnification.</h3>
      <p>
        You agree to indemnify Shutap against claims arising from your content or your violation of
        these terms.
      </p>

      <h3>14. Termination.</h3>
      <p>You may delete your account anytime. We may suspend or terminate access for violations.</p>

      <h3>15. Dispute resolution &amp; governing law.</h3>
      <p>
        Before filing any claim, you agree to first contact us at legal@shutap.com and try to
        resolve it informally for at least 30 days. Any dispute that cannot be resolved that way
        will be settled by <b>binding individual arbitration</b>, not in court — except that either
        party may bring an individual claim in small-claims court. You and Shutap{' '}
        <b>waive any right to a jury trial and to participate in a class action</b> or class-wide
        arbitration. These terms are governed by the laws of the State of Delaware, USA, without
        regard to its conflict-of-laws rules; the exclusive venue for any matter not subject to
        arbitration is the state or federal courts located in Delaware.
      </p>

      <h3>16. Changes.</h3>
      <p>
        We may update these terms; material changes will be notified and re-accepted, with a new
        version stamp.
      </p>

      <h3>17. Contact.</h3>
      <p>legal@shutap.com.</p>

    </DocLayout>
  )
}
