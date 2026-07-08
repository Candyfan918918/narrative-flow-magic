import { createFileRoute } from "@tanstack/react-router";
import { PillarPage } from "@/components/seo/PillarPage";
import { SITE_URL } from "@/lib/site";

const PATH = "/marriage";
const TITLE = "Marriage — real stories about married life | Shutap";
const DESCRIPTION =
  "Pseudonymous stories about marriage — resentment, repair, roommate energy, staying, leaving — and what actually happened next. You're not the only one.";
const H1 = "marriage";
const CAPSULE =
  "The long-haul stuff: roommate energy, resentment, repair, the question of leaving or staying. This is where people vent about their marriages — pseudonymously, honestly — and come back to share what actually happened next. If you're carrying something heavy, someone here has carried it too.";
const WHAT =
  "Marriage is where the quiet, complicated things live: the distance that crept in, the same argument on a loop, the part of you that wonders. Spill it under a pseudonym, hear from people who've been in it for years, and see, over time, what actually helped and what didn't.";
const INVITE =
  "No performance, no highlight reel. Just what it's actually like — and what happened next.";
const FAQ = [
  {
    q: "Is it normal to feel lonely or distant in my marriage?",
    a: "It's one of the most common things people bring to Shutap. Distance, resentment, and roommate energy show up again and again — and reading how others named it and moved through it is often where people start.",
  },
  {
    q: "Can I vent about my marriage without my spouse or anyone knowing?",
    a: "Yes. You post under a pseudonym, never your real name, and identifying details are removed before storage. Nothing ties a story back to you.",
  },
  {
    q: "How is this different from marriage advice online?",
    a: "Shutap isn't advice — it's lived experience with outcomes. People come back to record what actually happened, so you see how situations like yours tended to resolve for real people, not what an article thinks should happen.",
  },
];
const PILLAR = "Marriage";
const OTHERS = [
  { href: "/relationships", label: "Relationships" },
  { href: "/family", label: "Family" },
  { href: "/career", label: "Career" },
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
          "@type": "CollectionPage",
          name: PILLAR,
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
            { "@type": "ListItem", position: 2, name: PILLAR, item: PATH },
          ],
        }),
      },
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
      h1={H1}
      capsule={CAPSULE}
      what={WHAT}
      invite={INVITE}
      faq={FAQ}
      others={OTHERS}
    />
  ),
});
