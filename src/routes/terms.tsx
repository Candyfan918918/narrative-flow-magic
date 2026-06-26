import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { LEGAL_VERSION } from "@/lib/seo/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Shutap" },
      { name: "description", content: "Shutap terms of service. Pseudonymous peer-support community, 18+, not a medical or legal service." },
      { property: "og:title", content: "Terms of Service — Shutap" },
      { property: "og:description", content: "The rules of the room." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SeoPage>
      <article className="prose prose-neutral max-w-none space-y-5 dark:prose-invert">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">
            Version {LEGAL_VERSION.terms} · Operator: [LEGAL ENTITY NAME] ("Shutap," "we," "us")
          </p>
          <p className="text-xs text-muted-foreground">
            Draft pending attorney review. Not legal advice.
          </p>
        </header>

        <section>
          <h2>1. What Shutap is — and is not</h2>
          <p>
            Shutap is a pseudonymous peer-support and journaling community with an AI companion. It is a space to vent, to feel less alone, and to record what happened next. <strong>Shutap is not a healthcare, medical, mental-health, crisis, or legal service.</strong> Using Shutap does not create a therapist–patient, physician–patient, attorney–client, or any other professional relationship. Nothing on Shutap — including anything our AI companion or the "Mirror" says — is medical, psychological, or legal advice, diagnosis, or treatment. Do not use Shutap as a substitute for professional care.
          </p>
        </section>

        <section>
          <h2>2. Emergencies</h2>
          <p>
            Shutap is not for emergencies. If you or someone else may be in danger or crisis, contact emergency services (in the US, call or text <strong>988</strong> or call <strong>911</strong>) or the resources at findahelpline.com. Our companion will route you to these resources, but it cannot and does not provide crisis intervention.
          </p>
        </section>

        <section>
          <h2>3. Eligibility</h2>
          <p>You must be <strong>18 or older</strong> to use Shutap. By using it you represent that you are 18+.</p>
        </section>

        <section>
          <h2>4. Your account and pseudonym</h2>
          <p>
            You use Shutap under a pseudonym; your real name is not displayed. We do not guarantee anonymity against lawful legal process (e.g., a valid subpoena) and may disclose information where legally required (see <a href="/privacy">Privacy Policy</a>). You are responsible for activity under your account.
          </p>
        </section>

        <section>
          <h2>5. Your content</h2>
          <p>
            You own what you write. By posting, you grant us a non-exclusive, worldwide, royalty-free license to host, store, de-identify, display (where you choose to make content public), and use de-identified content to operate and improve the service, including aggregated, de-identified insights. You represent that your content is yours to share and does not violate anyone's rights. <strong>Do not post other people's private or identifying information; do not post unlawful, infringing, harassing, or harmful content</strong> (see <a href="/guidelines">Community Guidelines</a>).
          </p>
        </section>

        <section>
          <h2>6. AI-generated content</h2>
          <p>
            Shutap's companion and Mirror are powered by artificial intelligence. AI responses are generated automatically, <strong>may be inaccurate, incomplete, or inappropriate, and must not be relied upon</strong> for any decision. They are for reflection and support only, are provided "as is," and are not the advice of any professional. You use AI features at your own discretion and risk. See <a href="/ai-disclosure">AI Disclosure</a>.
          </p>
        </section>

        <section>
          <h2>7. Acceptable use</h2>
          <p>
            You agree not to: post others' personal/identifying information; harass, threaten, or abuse; post illegal content (including any sexual content involving minors); impersonate; spam; scrape or misuse the service or its AI; attempt to de-anonymize other users; or use Shutap to provide professional services to others. We may remove content and suspend accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2>8. Reporting and takedown</h2>
          <p>
            You can report content via the in-product report tools. We review reports and remove content that violates these terms or the law, and we maintain a path for individuals to request removal of content about them. See <a href="/report">/report</a>.
          </p>
        </section>

        <section>
          <h2>9. Assumption of risk</h2>
          <p>
            Shutap involves user-generated emotional content and AI-generated responses. You understand and accept that such content may be upsetting, inaccurate, or unhelpful, and you use the service at your own risk.
          </p>
        </section>

        <section>
          <h2>10. Disclaimers</h2>
          <p>
            The service is provided "as is" and "as available," without warranties of any kind, express or implied, including fitness for a particular purpose and any warranty that the service or AI output is accurate, reliable, or suitable for your needs.
          </p>
        </section>

        <section>
          <h2>11. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, [LEGAL ENTITY] and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any reliance on AI output or user content; and our total liability will not exceed the greater of amounts you paid us in the past [12] months or <strong>[US$100]</strong>.
          </p>
        </section>

        <section>
          <h2>12. Indemnification</h2>
          <p>You agree to indemnify [LEGAL ENTITY] against claims arising from your content or your violation of these terms.</p>
        </section>

        <section>
          <h2>13. Termination</h2>
          <p>You may delete your account anytime. We may suspend or terminate access for violations.</p>
        </section>

        <section>
          <h2>14. Dispute resolution &amp; governing law</h2>
          <p>[LAWYER DECISION: arbitration clause + class-action waiver + governing law/venue.]</p>
        </section>

        <section>
          <h2>15. Changes</h2>
          <p>We may update these terms; material changes will be notified and re-accepted, with a new version stamp.</p>
        </section>

        <section>
          <h2>16. Contact</h2>
          <p>[LEGAL CONTACT EMAIL].</p>
        </section>
      </article>
    </SeoPage>
  );
}
