import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";

const PATH = "/trust";
const TITLE =
  "Trust & privacy at Shutap — pseudonymous by design, PII scrubbed before storage";
const DESCRIPTION =
  "How Shutap protects you: pseudonymity, automatic removal of personal identifiers before storage, what is and isn't public, and a fast takedown path.";
const CAPSULE =
  "Shutap is pseudonymous by design. You post under an alias, and an automatic scrubber removes personal identifiers before anything is stored — only the scrubbed version is kept. Crisis messages are never public. Your real name is never shown.";
const SECTIONS = [
  {
    heading: "pseudonymous, not exposed",
    body: "You choose a consistent alias. Your real name never appears to other users. Pseudonymity is stronger than anonymity — your voice builds a history without revealing who you are.",
  },
  {
    heading: "the scrubber",
    body: "Before storage, an automatic pass removes names, addresses, specific locations, phone numbers, and emails from what you write. We keep the de-identified version, not the raw text.",
  },
  {
    heading: "what is and isn't public",
    body: "Only content you choose to make public appears to the community, always de-identified. Private entries and crisis-flagged messages are never shown publicly and are never sold.",
  },
  {
    heading: "your rights",
    body: "You can edit or delete any story, export your data, and delete your account at any time.",
  },
  {
    heading: "takedown",
    body: "If a story is about you, there's a fast path to request its removal. Contact privacy@shutap.com.",
  },
];
const OTHERS = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
];

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}${PATH}` },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}${PATH}` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Trust & privacy at Shutap",
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
        }),
      },
    ],
  }),
  component: () => (
    <ContentPage
      h1="trust & privacy"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
