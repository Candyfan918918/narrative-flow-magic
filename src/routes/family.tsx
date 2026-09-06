import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { PillarPage } from "@/components/seo/PillarPage";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/family";
const TITLE = "Family — parents, siblings, in-laws: real stories | Shutap";
const DESCRIPTION =
  "Family, as material: parents, siblings, in-laws, the dinner comment, the guilt. type what happened and shutap writes you a set.";
const H1 = "family";
const CAPSULE =
  "Parents, siblings, in-laws, the dinner comment, the guilt that comes with all of it. Type what happened and shutap writes you a set of joke cards about the situation — pseudonymously, never about you.";
const WHAT =
  "Family is the stuff that's hard to say out loud to anyone who knows them: the parent who won't change, the sibling thing that never ended, the in-laws, the comment at dinner. Type it under a pseudonym and shutap writes the set.";
const INVITE =
  "You can type the thing here you can't say at dinner. shutap writes the set.";
const FAQ = [
  {
    q: "Is it normal to feel guilty about my family?",
    a: "Very. Guilt, obligation and the pull between love and distance are some of the most common things typed in here \u2014 and some of the best material.",
  },
  {
    q: "Can I write about my family privately?",
    a: "Yes \u2014 under a pseudonym, with identifying details removed before storage. Nothing is published unless you post it.",
  },
  {
    q: "What will I get here that I won't get elsewhere?",
    a: "Not a verdict and not advice. A set of joke cards about the situation, written the way a comedian works a bad dinner into a bit.",
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
