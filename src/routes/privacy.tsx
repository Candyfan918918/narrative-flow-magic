import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";

const PATH = "/privacy";
const URL = "https://narrative-flow-magic.lovable.app/privacy";
const TITLE = "Privacy Policy — Shutap";
const DESCRIPTION =
  "How Shutap protects your privacy: pseudonymous by design, PII scrubbed before storage, no sale of your data, and full rights to access, export, and delete.";
const CAPSULE =
  "Effective July 1, 2026. Controller: Shutap. Contact: privacy@shutap.com. The short version: Shutap is pseudonymous by design, an automatic scrubber removes personal identifiers before anything is stored, we keep only the scrubbed version, we do not sell your personal information, and you can access, export, or delete your data at any time.";

const SECTIONS = [
  { heading: "Our approach", body: "Shutap is built to be pseudonymous and privacy-protective. You write under a pseudonym, and our scrubber automatically removes personal identifiers (names, addresses, specific locations, phone numbers, emails) before storage — we keep only the scrubbed version." },
  { heading: "What we collect", body: "Account: a pseudonym, your email (sign-in and check-ins), timezone, notification preferences, consent records. Content: your stories and check-in responses, stored only in scrubbed form. Usage: analytics via PostHog, tied to a pseudonymous ID. Device/technical: standard log and device data." },
  { heading: "How we use it", body: "To run the community and companion; deliver check-ins; provide the Mirror (your patterns over time, for subscribers); produce aggregated, de-identified insights; keep the service safe; and comply with law. We do not sell your personal information." },
  { heading: "AI processing", body: "Your messages are processed by Anthropic (Claude models) to generate responses. Under Anthropic's commercial API terms, your inputs are not used to train their models. AI processing happens only to provide these features to you." },
  { heading: "Service providers", body: "Supabase (database and hosting), Anthropic (AI responses), PostHog (analytics), Stripe (payments for the Mirror), and Resend (email delivery). Each processes data only to provide their service to Shutap." },
  { heading: "Legal and safety disclosure", body: "We may disclose information where required by law or to prevent imminent harm. Crisis-flagged content is kept private, excluded from public display and our aggregated corpus, and is never sold or monetized." },
  { heading: "Retention", body: "We keep your data while your account is active and as needed for the purposes above; you can delete your content or account at any time." },
  { heading: "Security", body: "We use reasonable technical and organizational measures to protect your data. No system is perfectly secure. In a breach affecting your personal data, we will notify you and the authorities as required by law." },
  { heading: "Your rights", body: "Depending on where you live (including under GDPR and California's CCPA/CPRA), you may have the right to access, correct, delete, export, object to, or restrict processing, and to withdraw consent. Delete your stories and account, or request an export, from Account & Data settings or via privacy@shutap.com. We do not sell personal information. We will not discriminate against you for exercising these rights. We honor verified requests within 30 days." },
  { heading: "Children", body: "Shutap is for adults 18+. We do not knowingly collect data from anyone under 18; if we learn we have, we delete it." },
  { heading: "International users and transfers", body: "Shutap is operated from the United States. If you access it from outside the US, your data is processed in the US. Where required for EU or UK users, we rely on appropriate safeguards (such as Standard Contractual Clauses) with our providers." },
  { heading: "Cookies", body: "We use essential cookies to run the service and privacy-preserving analytics (PostHog). We do not use advertising cookies. Where required, we show a consent banner and default to declining non-essential cookies." },
  { heading: "Contact", body: "Questions or requests: privacy@shutap.com. We are not currently required to appoint a Data Protection Officer or EU/UK representative; we will do so if and when required as we grow." },
];

const OTHERS = [
  { href: "/terms", label: "Terms" },
  { href: "/guidelines", label: "Community guidelines" },
  { href: "/safety", label: "Safety" },
  { href: "/ai-disclosure", label: "AI disclosure" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal & policies" },
];

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: URL,
        }),
      },
    ],
  }),
  component: () => (
    <ContentPage
      h1="privacy policy"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
