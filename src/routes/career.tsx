import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { PillarPage } from "@/components/seo/PillarPage";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/career";
const TITLE = "Career & work — real stories about work life | Shutap";
const DESCRIPTION =
  "Work, as material: managers, burnout, money, the job you're supposed to be grateful for. type what happened and shutap writes you a set.";
const H1 = "career";
const CAPSULE =
  "Work, money, managers, burnout, the job everyone says you should be grateful for. Type what happened and shutap writes you a set of joke cards about the situation \u2014 never about you.";
const WHAT =
  "Career is where the things you can't say on Slack go: the burnout you're hiding, the manager who is the problem, the money stress, the quiet urge to quit. Type it under a pseudonym and shutap writes the set.";
const INVITE =
  "No LinkedIn voice. Just what work is really doing to you \u2014 and a set written about it.";
const FAQ = [
  {
    q: "Is it normal to feel burned out or stuck at work?",
    a: "Extremely. Burnout, resentment and feeling trapped in a good job are among the most common things typed in here.",
  },
  {
    q: "Can I write about my job or manager without it getting back to me?",
    a: "Yes. You write under a pseudonym, never your real name, and identifying details are stripped before storage.",
  },
  {
    q: "How is this more useful than career advice?",
    a: "It isn\u2019t advice and doesn\u2019t try to be. You get a set of joke cards about the situation \u2014 which is what makes the meeting survivable, not a five-step framework.",
  },
];
const PILLAR = "Career";
const OTHERS = [
  { href: "/relationships", label: "Relationships" },
  { href: "/marriage", label: "Marriage" },
  { href: "/family", label: "Family" },
  { href: "/lived-intelligence", label: "Lived intelligence" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export const Route = createFileRoute("/career")({
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
