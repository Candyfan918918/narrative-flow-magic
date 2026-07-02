import { createFileRoute } from "@tanstack/react-router";
import { PillarPage } from "@/components/seo/PillarPage";

const PATH = "/career";
const TITLE =
  "Career & work — vent and read real stories about work life | Shutap";
const DESCRIPTION =
  "Real, pseudonymous stories about work — bosses, burnout, money, the job you're supposed to be grateful for — and what actually happened next. You're not alone in it.";
const H1 = "career";
const CAPSULE =
  "Work, money, bosses, burnout, the job everyone says you should be grateful for. This is where people vent about work — pseudonymously, honestly — and come back to share what actually happened next. Whatever's grinding you down, someone here has felt it.";
const WHAT =
  "Career is where the things you can't say on Slack go: the burnout you're hiding, the boss who's the problem, the money stress, the quiet urge to quit. Spill it under a pseudonym, hear from people in the same grind, and see what they actually did next.";
const INVITE =
  "No LinkedIn voice. Just what work is really doing to you — and what happened after.";
const FAQ = [
  {
    q: "Is it normal to feel burned out or stuck at work?",
    a: "Extremely. Burnout, resentment, and feeling trapped in a good job are among the most common things people bring to Shutap. Reading others in the same place is often the first step out of the fog.",
  },
  {
    q: "Can I vent about my job or boss without it getting back to me?",
    a: "Yes. You post under a pseudonym, never your real name, and identifying details are stripped before storage — so you can be honest about work safely.",
  },
  {
    q: "How is this more useful than career advice?",
    a: "It's real outcomes, not tips. People return to share what actually happened after they set a boundary, pushed back, or left — so you see how situations like yours tend to play out.",
  },
];
const PILLAR = "Career";
const OTHERS = [
  { href: "/relationships", label: "Relationships" },
  { href: "/marriage", label: "Marriage" },
  { href: "/family", label: "Family" },
];

export const Route = createFileRoute("/career")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PATH },
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
