import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { PillarPage } from "@/components/seo/PillarPage";
import { SITE_URL } from "@/lib/site";

const PATH = "/family";
const TITLE = "Family — parents, siblings, in-laws: real stories | Shutap";
const DESCRIPTION =
  "Pseudonymous stories about family — parents, siblings, in-laws, group chats, the guilt — and what actually happened next. Someone here gets it.";
const H1 = "family";
const CAPSULE =
  "Parents, siblings, in-laws, the family group chat, the guilt that comes with all of it. This is where people vent about family — pseudonymously, honestly — and come back to share what actually happened next. Whatever the dynamic, someone here has lived it.";
const WHAT =
  "Family is the stuff that's hard to say out loud to anyone who knows them: the parent who won't change, the sibling rivalry that never ended, the in-laws, the boundary you can't seem to hold. Spill it under a pseudonym, and hear from people who love and struggle with their families too.";
const INVITE =
  "You can say the thing here you can't say at dinner. Start wherever it hurts.";
const FAQ = [
  {
    q: "Is it normal to feel guilty about my family?",
    a: "Very. Guilt, obligation, and the pull between love and distance are some of the most common threads on Shutap. Seeing others name the same feeling is often the first time it feels okay to.",
  },
  {
    q: "Can I post about my family privately?",
    a: "Yes — under a pseudonym, with identifying details removed before storage. You can be honest about your family without exposing yourself or them.",
  },
  {
    q: "What will I get here that I won't get elsewhere?",
    a: "Not verdicts — outcomes. People come back to share what actually happened after they set the boundary, had the conversation, or stepped back, so you can see how it tends to go for people in your spot.",
  },
];
const PILLAR = "Family";
const OTHERS = [
  { href: "/relationships", label: "Relationships" },
  { href: "/marriage", label: "Marriage" },
  { href: "/career", label: "Career" },
  { href: "/lived-intelligence", label: "Lived intelligence" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export const Route = createFileRoute("/family")({
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
