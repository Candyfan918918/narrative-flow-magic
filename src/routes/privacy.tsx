import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { LEGAL_VERSION } from "@/lib/seo/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Shutap" },
      { name: "description", content: "How Shutap handles your pseudonymous stories and personal data. Scrubbed by default; never sold." },
      { property: "og:title", content: "Privacy Policy — Shutap" },
      { property: "og:description", content: "Pseudonymous by design. Scrubbed by default. Never sold." },
      { name: "robots", content: "index,follow" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SeoPage>
      <article className="prose prose-neutral max-w-none space-y-5 dark:prose-invert">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Version {LEGAL_VERSION.privacy} · Controller: [LEGAL ENTITY] · Contact: [PRIVACY EMAIL]
          </p>
          <p className="text-xs text-muted-foreground">Draft pending attorney review.</p>
        </header>

        <section>
          <h2>1. Our approach</h2>
          <p>
            Shutap is built to be pseudonymous and privacy-protective. You write under a pseudonym, and our Scrubber automatically removes personal identifiers (names, addresses, specific locations, phone numbers, emails) from what you write <strong>before it is stored</strong> — we keep only the scrubbed version.
          </p>
        </section>

        <section>
          <h2>2. What we collect</h2>
          <ul>
            <li><strong>Account:</strong> a pseudonym, your email (for sign-in and check-ins), timezone, notification preferences, consent records.</li>
            <li><strong>Content:</strong> your stories and check-in responses — stored <strong>only in scrubbed (de-identified) form</strong>.</li>
            <li><strong>Usage:</strong> analytics about how you use the app, tied to a pseudonymous ID, not your name.</li>
            <li><strong>Device/technical:</strong> standard log/device data.</li>
          </ul>
        </section>

        <section>
          <h2>3. How we use it</h2>
          <p>
            To run the community and companion; to deliver check-ins; to provide the Mirror (your patterns over time, for subscribers); to produce <strong>aggregated, de-identified</strong> insights; to keep the service safe; and to comply with law. <strong>We do not sell your personal information.</strong>
          </p>
        </section>

        <section>
          <h2>4. AI processing</h2>
          <p>
            Your messages are processed by AI models (via our AI Gateway and/or Anthropic) to generate companion and Mirror responses. [Confirm provider data-handling terms; reference their no-training-on-your-data commitments if applicable.]
          </p>
        </section>

        <section>
          <h2>5. Service providers (subprocessors)</h2>
          <p>Hosting/database (Lovable Cloud), email (Resend), analytics (PostHog), AI responses (Anthropic / AI provider). Each processes data only to provide their service.</p>
        </section>

        <section>
          <h2>6. Legal / safety disclosure</h2>
          <p>
            We may disclose information where required by law (e.g., valid legal process) or to prevent imminent harm. Crisis-flagged content is kept private, excluded from public display and from our aggregated corpus, and is never sold or monetized.
          </p>
        </section>

        <section>
          <h2>7. Retention</h2>
          <p>We keep your data while your account is active and as needed for the purposes above; you can delete your content or account at any time.</p>
        </section>

        <section>
          <h2>8. Security</h2>
          <p>We use reasonable technical and organizational measures to protect your data. No system is perfectly secure. In the event of a breach affecting your personal data, we will notify you and authorities as required by applicable law.</p>
        </section>

        <section>
          <h2>9. Your rights</h2>
          <p>
            Depending on where you live (including under <strong>GDPR</strong> and <strong>California's CCPA/CPRA</strong>), you may have the right to access, correct, delete, export (port), object to, or restrict processing of your personal data, and to withdraw consent. <strong>You can delete your stories and your account, and request a data export, from your <a href="/profile">Profile</a></strong>, or by emailing [PRIVACY EMAIL]. We do not sell personal information. We will not discriminate against you for exercising these rights.
          </p>
        </section>

        <section>
          <h2>10. Children</h2>
          <p>Shutap is for adults <strong>18+</strong>. We do not knowingly collect data from anyone under 18; if we learn we have, we delete it.</p>
        </section>

        <section>
          <h2>11. International transfers</h2>
          <p>[If applicable — mechanisms for EU/UK transfers.]</p>
        </section>

        <section>
          <h2>12. Cookies</h2>
          <p>[Essential vs analytics cookies; consent banner if serving EU/UK — default to privacy-preserving.]</p>
        </section>

        <section>
          <h2>13. Changes &amp; contact</h2>
          <p>We'll post updates with a new effective date. Questions or requests: [PRIVACY EMAIL].</p>
        </section>
      </article>
    </SeoPage>
  );
}
