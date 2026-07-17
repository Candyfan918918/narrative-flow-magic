import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";

const PATH = "/how-it-works";
const TITLE = "How Shutap works — real people, AI-guided | Shutap";
const DESCRIPTION =
  "How stories on Shutap are written (real people, not AI-written), how outcomes get confirmed, and how sensitive topics are routed to real help.";
const CAPSULE =
  "Stories on Shutap are written by real people about their real lives. AI agents help you find the words and reflect what you share — they never write your story or pose as a person. Later, you come back to confirm what actually happened, which is what makes Shutap's record different from opinion.";
const SECTIONS = [
  {
    heading: "you spill",
    body: "Start with whatever's on your mind. An AI companion listens and reflects it back, helping you get it out — guided by AI, written by you.",
  },
  {
    heading: "your privacy is protected first",
    body: "Before anything is stored, a scrubber removes personal identifiers — names, addresses, locations, phone numbers, emails. Only the de-identified version is kept, and you post under a pseudonym.",
  },
  {
    heading: "you come back",
    body: "Days and weeks later, Shutap asks what happened next. Your confirmed outcome turns a one-time vent into something useful for the next person facing the same thing.",
  },
  {
    heading: "sensitive moments route to real help",
    body: "If something serious comes up, the companion stops and points you to real human support — it doesn't treat a crisis as content.",
  },
  {
    heading: "why confirmed outcomes matter",
    body: "Opinions are everywhere. Outcomes are rare. By capturing what actually happened, Shutap builds a picture of how real situations resolve — the difference from an advice thread.",
  },
];
const OTHERS = [
  { href: "/about", label: "About" },
  { href: "/trust", label: "Trust & privacy" },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}${PATH}` },
      ...ogImageMeta(),
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
          name: "How Shutap works",
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
        }),
      },
    ],
  }),
  component: () => (
    <ContentPage
      h1="how Shutap works"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
