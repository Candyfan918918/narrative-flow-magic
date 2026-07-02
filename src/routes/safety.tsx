import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";

const URL = `${SITE_URL}/safety`;
const TITLE = "Safety at Shutap — crisis resources and how we respond";
const DESCRIPTION =
  "Shutap is not a crisis service, but safety is built in. Crisis resources (988, Samaritans, findahelpline) and how the companion routes you to real help.";
const CAPSULE =
  "Shutap is not a crisis service, but safety is built in. If you're in danger or thinking about harming yourself, please reach out to real help right now — you deserve support from a trained person.";

const SECTIONS = [
  { heading: "If you're in crisis", body: "In the US, call or text 988 (Suicide & Crisis Lifeline). In the UK, call Samaritans at 116 123. Anywhere, find a local helpline at findahelpline.com. If someone is in immediate danger, contact emergency services." },
  { heading: "How Shutap responds", body: "When the companion notices signs of crisis, it stops and shares these resources. It does not treat a crisis as content — crisis messages are kept private, never shown publicly, and never monetized." },
  { heading: "What Shutap is not", body: "Shutap is not a therapist, counselor, or emergency service, and the AI cannot provide crisis intervention. It's a place for support and reflection, alongside — not instead of — real help." },
  { heading: "Looking out for each other", body: "If you see someone who may be at risk, encourage them toward real support and use the report tools so we can help." },
];

const OTHERS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/guidelines", label: "Community guidelines" },
  { href: "/ai-disclosure", label: "AI disclosure" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal & policies" },
];

export const Route = createFileRoute("/safety")({
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
      h1="safety"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
