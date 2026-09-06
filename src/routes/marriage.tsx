import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { PillarPage } from "@/components/seo/PillarPage";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/marriage";
const TITLE = "Marriage — real stories about married life | Shutap";
const DESCRIPTION =
  "Marriage, as material: resentment, repair, roommate energy, staying, leaving. type what happened and shutap writes you a set of joke cards.";
const H1 = "marriage";
const CAPSULE =
  "The long-haul stuff: roommate energy, resentment, repair, the question of leaving or staying. Type what happened and shutap writes you a set of joke cards about the situation \u2014 never about you.";
const WHAT =
  "Marriage is where the quiet, complicated things live: the distance that crept in, the same argument on a loop, the part of you that wonders. Type it under a pseudonym and shutap writes the set. You flip the cards one at a time and keep the ones that land.";
const INVITE =
  "No performance, no highlight reel. Just what it's actually like \u2014 and a set written about it.";
const FAQ = [
  {
    q: "Is it normal to feel lonely or distant in my marriage?",
    a: "It\u2019s one of the most common things people type in here. Distance, resentment and roommate energy show up again and again \u2014 and they make unusually good material.",
  },
  {
    q: "Can I write about my marriage without my spouse or anyone knowing?",
    a: "Yes. You write under a pseudonym, never your real name, and identifying details are removed before storage. Nothing ties a set back to you.",
  },
  {
    q: "How is this different from marriage advice online?",
    a: "Shutap doesn\u2019t give advice at all. It writes jokes about the situation. If you want instructions, this is the wrong website.",
  },
];
const PILLAR = "Marriage";
const OTHERS = [
  { href: "/relationships", label: "Relationships" },
  { href: "/family", label: "Family" },
  { href: "/career", label: "Career" },
  { href: "/lived-intelligence", label: "Lived intelligence" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export const Route = createFileRoute("/marriage")({
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
