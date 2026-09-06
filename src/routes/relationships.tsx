import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/relationships";
const TITLE = "Relationships — vent about dating & breakups | Shutap";
const DESCRIPTION =
  "Real, pseudonymous stories about relationships — dating, partners, situationships, breakups — and what happened next. Someone has lived your thing.";
const H1 = "relationships";
const CAPSULE =
  "Dating, partners, situationships, breakups, and the gray area in between. This is where people vent about what's happening in their relationships — pseudonymously, honestly — and come back to share what actually happened next. Whatever you're sitting with, someone here has lived a version of it.";
const WHAT =
  "Relationships is where the messy middle goes: the text you're overthinking, the fight that keeps repeating, the situationship with no name, the breakup you're not sure about. Spill it under a pseudonym, hear from people who've been exactly here, and — later — find out what they did next and how it turned out.";
const INVITE =
  "You don't have to have the words yet. Start with what's on your mind; the room takes it from there.";
const FAQ = [
  {
    q: "Is it normal to feel this way about my relationship?",
    a: "Almost certainly. The most common thing people discover on Shutap is that the exact situation they thought was theirs alone is one hundreds of others are living too. Reading real stories from people in the same spot is often the first relief.",
  },
  {
    q: "Can I post about my relationship pseudonymously?",
    a: "You post under a consistent pseudonym, never your real name, and personal identifiers are removed before anything is stored. Your voice is yours; your identity stays protected.",
  },
  {
    q: "What makes Shutap different from asking Reddit?",
    a: "You come back. On Shutap, people return to share what actually happened after the moment passed — so over time you can see how situations like yours tend to resolve, not just what strangers think you should do.",
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
