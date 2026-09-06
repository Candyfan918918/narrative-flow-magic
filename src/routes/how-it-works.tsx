import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/how-it-works";
const TITLE = "How Shutap works — you type it, shutap writes the set";
const DESCRIPTION =
  "how a set gets written: you type what happened, identifying details are stripped, and shutap writes joke cards at the situation — never at you.";
const CAPSULE =
  "every comedian you like does this on purpose: take the worst thing that happened and work it into a routine. you already have the material. shutap does the writing part.";
const SECTIONS = [
  {
    heading: "you type what happened",
    body: "One open box. No category to pick, no bar to clear. If it's still in your head at midnight, it's material.",
  },
  {
    heading: "identifying details come out first",
    body: "Before anything is stored, names, addresses, workplaces, phone numbers and emails are stripped. Only the scrubbed version is kept, and you write under a pseudonym.",
  },
  {
    heading: "shutap writes the set",
    body: "Each card takes a different comedic angle on the same situation — the absurd detail, the pattern, the whole thing played back as a nature documentary. They arrive face down. You flip them one at a time.",
  },
  {
    heading: "you keep the ones that land",
    body: "Keep a card, save it as an image, send it to the group chat, or post it to a room. The ones that don't land, you leave face down.",
  },
  {
    heading: "the joke goes at the situation",
    body: "Never at you. Shutap doesn't make fun of your pain, doesn't diagnose you, and doesn't tell you what to do. If something is genuinely heavy, it stops joking and points you at real help.",
  },
  {
    heading: "and then it starts noticing",
    body: "Flip enough cards and the same person, the same week of the month, the same move keeps showing up. That's the Mirror — the paid part that reads your own record back to you.",
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
      breadcrumbScript([{ name: "How it works", path: PATH }]),
    ],
  }),
  component: () => (
    <ContentPage
      breadcrumbs={[{ name: "How it works", path: PATH }]}
      h1="how Shutap works"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
