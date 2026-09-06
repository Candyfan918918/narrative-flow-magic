import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/relationships";
const TITLE = "Relationships — vent about dating & breakups | Shutap";
const DESCRIPTION =
  "Dating, partners, situationships, breakups — as material. type what happened and shutap writes you a set of joke cards about it.";
const H1 = "relationships";
const CAPSULE =
  "Dating, partners, situationships, breakups, and the gray area in between. Type what happened and shutap writes you a set of joke cards — every card a different angle on the same mess, always at the situation and never at you.";
const WHAT =
  "Relationships is where the messy middle goes: the text you're overthinking, the fight that keeps repeating, the situationship with no name, the breakup you're not sure about. Type it under a pseudonym and shutap turns it into a set you flip one card at a time. Keep the ones that land.";
const INVITE =
  "You don't have to have the words yet. Type whatever it is; shutap writes the set.";
const FAQ = [
  {
    q: "Is it normal to feel this way about my relationship?",
    a: "Almost certainly. The situation you thought was uniquely yours is one plenty of people are living too. Shutap doesn\u2019t rule on it \u2014 it writes jokes about it, which is a faster way out of your own head.",
  },
  {
    q: "Can I post about my relationship pseudonymously?",
    a: "You write under a consistent pseudonym, never your real name, and identifying details are stripped before anything is stored.",
  },
  {
    q: "What makes Shutap different from asking Reddit?",
    a: "Nobody here is going to tell you what to do. You type what happened and get a set of joke cards \u2014 the absurd detail, the pattern, the whole thing played back at an angle you hadn\u2019t tried.",
  },
];
const PILLAR = "Relationships";
const OTHERS = [
  { href: "/marriage", label: "Marriage" },
  { href: "/family", label: "Family" },
  { href: "/career", label: "Career" },
  { href: "/lived-intelligence", label: "Lived intelligence" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export const Route = createFileRoute("/relationships")({
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
          "@type": "CollectionPage",
          name: PILLAR,
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
        }),
      },
      breadcrumbScript([{ name: PILLAR, path: PATH }]),
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: () => (
    <PillarPage
      breadcrumbs={[{ name: PILLAR, path: PATH }]}
      h1={H1}
      capsule={CAPSULE}
      what={WHAT}
      invite={INVITE}
      faq={FAQ}
      others={OTHERS}
    />
  ),
});

import { PillarPage } from "@/components/seo/PillarPage";
