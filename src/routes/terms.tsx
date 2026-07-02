import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";

const PATH = "/terms";
const URL = `${SITE_URL}/terms`;
const TITLE = "Terms of Service — Shutap";
const DESCRIPTION =
  "The terms for using Shutap, a pseudonymous peer-support community with AI-guided support. What Shutap is and isn't, your content, AI use, and your rights.";
const CAPSULE =
  "Effective July 1, 2026. Operator: Shutap. These terms govern your use of Shutap, a pseudonymous peer-support community with AI-guided support. In plain terms: Shutap is a place to be heard, not a medical, mental-health, or legal service; you own what you write; the AI can be wrong; and you must be 18 or older.";

const SECTIONS = [
  { heading: "What Shutap is — and is not", body: "Shutap is a pseudonymous peer-support and journaling community with AI-guided support — a space to vent and record what happened next. Shutap is not a healthcare, medical, mental-health, crisis, or legal service. Using it does not create a therapist–patient, physician–patient, attorney–client, or any other professional relationship. Nothing on Shutap, including anything the AI says, is medical, psychological, or legal advice, diagnosis, or treatment." },
  { heading: "Emergencies", body: "Shutap is not for emergencies. If you or someone else may be in danger, contact emergency services (in the US, call or text 988, or call 911) or findahelpline.com. The companion routes you to these resources but cannot provide crisis intervention." },
  { heading: "Eligibility", body: "You must be 18 or older. By using Shutap you represent that you are 18+." },
  { heading: "Your account and pseudonym", body: "You use Shutap under a pseudonym; your real name is not displayed. We do not guarantee anonymity against lawful legal process and may disclose information where legally required. You are responsible for activity under your account." },
  { heading: "Your content", body: "You own what you write. By posting, you grant Shutap a non-exclusive, worldwide, royalty-free license to host, store, de-identify, display (where you make content public), and use de-identified content to operate and improve the service, including aggregated, de-identified insights. You represent your content is yours to share. Do not post others' private or identifying information, or unlawful, infringing, harassing, or harmful content." },
  { heading: "AI-generated content", body: "Shutap's features are powered by AI. AI responses are generated automatically, may be inaccurate or inappropriate, and must not be relied upon for any decision. They are for reflection and support only, provided \"as is,\" and are not the advice of any professional." },
  { heading: "Acceptable use", body: "You agree not to: post others' personal or identifying information; harass, threaten, or abuse; post illegal content (including any sexual content involving minors); impersonate; spam; scrape or misuse the service or its AI; attempt to de-anonymize others; or use Shutap to provide professional services. We may remove content and suspend accounts that violate these terms." },
  { heading: "Reporting and takedown", body: "Report content via in-product tools. We review reports and remove content that violates these terms or the law, and maintain a path for individuals to request removal of content about them (privacy@shutap.com)." },
  { heading: "Assumption of risk", body: "Shutap involves user-generated emotional content and AI-generated responses that may be upsetting, inaccurate, or unhelpful. You use the service at your own risk." },
  { heading: "Disclaimers", body: "The service is provided \"as is\" and \"as available,\" without warranties of any kind, express or implied, including fitness for a particular purpose or that AI output is accurate or reliable." },
  { heading: "Limitation of liability", body: "To the maximum extent permitted by law, Shutap and its operators are not liable for any indirect, incidental, special, consequential, or punitive damages, or for reliance on AI output or user content; and total liability will not exceed the greater of amounts you paid Shutap in the past 12 months or US$100. Some jurisdictions do not allow certain limitations, so parts may not apply to you." },
  { heading: "Indemnification", body: "You agree to indemnify Shutap against claims arising from your content or your violation of these terms." },
  { heading: "Termination", body: "You may delete your account anytime. We may suspend or terminate access for violations." },
  { heading: "Governing law and venue", body: "These terms are governed by the laws of the State of California, USA, without regard to conflict-of-laws rules. The state and federal courts located in California have jurisdiction over disputes not otherwise resolved." },
  { heading: "Changes", body: "We may update these terms; material changes will be notified and re-accepted with a new version date." },
  { heading: "Contact", body: "Questions about these terms: hello@shutap.com." },
];

const OTHERS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/guidelines", label: "Community guidelines" },
  { href: "/safety", label: "Safety" },
  { href: "/ai-disclosure", label: "AI disclosure" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal & policies" },
];

export const Route = createFileRoute("/terms")({
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
      h1="terms of service"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
