import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";

const URL = "https://narrative-flow-magic.lovable.app/legal";
const TITLE = "Legal & policies — Shutap";
const DESCRIPTION =
  "Hub for Shutap's legal and policy documents: terms of service, privacy policy, community guidelines, safety, AI disclosure, and FAQ.";
const CAPSULE =
  "Shutap's legal and policy documents in one place. Read the terms, understand how your privacy is protected, see how the community stays safe, and learn how AI is used.";

const SECTIONS = [
  { heading: "Terms of Service", body: "The terms that govern your use of Shutap — what Shutap is and isn't, your content, AI use, eligibility (18+), and your rights. Read at /terms." },
  { heading: "Privacy Policy", body: "How Shutap protects your privacy: pseudonymous by design, PII scrubbed before storage, no sale of your data, and full rights to access, export, and delete. Read at /privacy." },
  { heading: "Community Guidelines", body: "How to keep Shutap a safe place to be honest: protect privacy, aim any sharpness at situations not people, and never post anything that harms someone. Read at /guidelines." },
  { heading: "Safety", body: "Shutap is not a crisis service, but safety is built in. Crisis resources (988, Samaritans, findahelpline) and how the companion routes you to real help. Read at /safety." },
  { heading: "AI Disclosure", body: "What the AI does and doesn't, that it can be wrong, and which models power the companion and Mirror. Read at /ai-disclosure." },
  { heading: "FAQ", body: "Common questions about what Shutap is, whether it's therapy (it isn't), pseudonymity, privacy, the Mirror, and data deletion. Read at /faq." },
];

const OTHERS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/guidelines", label: "Community guidelines" },
  { href: "/safety", label: "Safety" },
  { href: "/ai-disclosure", label: "AI disclosure" },
  { href: "/faq", label: "FAQ" },
];

export const Route = createFileRoute("/legal")({
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
      h1="legal & policies"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
