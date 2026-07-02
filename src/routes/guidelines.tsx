import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";

const URL = "https://narrative-flow-magic.lovable.app/guidelines";
const TITLE = "Community Guidelines — Shutap";
const DESCRIPTION =
  "How to keep Shutap a safe place to be honest: protect privacy, aim any sharpness at situations not people, and never post anything that harms someone.";
const CAPSULE =
  "Shutap works because people can be honest without being exposed or attacked. In short: protect each other's privacy, aim any sharpness at situations not people, and never post anything that harms someone.";

const SECTIONS = [
  { heading: "Protect privacy — yours and others'", body: "Post under your alias, and never share information that could identify you or anyone else. Don't name real people or post private details about them." },
  { heading: "Be honest, not cruel", body: "Vent freely and react honestly, but aim any edge at the situation, not the person who shared. Support over pile-ons." },
  { heading: "No harmful content", body: "No harassment, threats, hate, or content that promotes self-harm or violence. Absolutely no sexual content involving minors." },
  { heading: "It's support, not advice", body: "Share your own experience and what happened to you. Don't present yourself as a professional or give medical, legal, or financial instructions to others." },
  { heading: "Keep it real", body: "Post about your own real experiences. Don't impersonate others or post fabricated stories as if they were real." },
  { heading: "Reporting", body: "If you see something that breaks these guidelines, use the report tools. We review reports and remove violating content." },
];

const OTHERS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/safety", label: "Safety" },
  { href: "/ai-disclosure", label: "AI disclosure" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal & policies" },
];

export const Route = createFileRoute("/guidelines")({
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
      h1="community guidelines"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
