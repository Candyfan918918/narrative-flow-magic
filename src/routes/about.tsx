import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";

const PATH = "/about";
const TITLE = "About Shutap — pseudonymous venting with AI support";
const DESCRIPTION =
  "What Shutap is, who it's for, and how it differs from anonymous venting on Reddit or AITA. Pseudonymous, private by design, outcomes confirmed.";
const CAPSULE =
  "Shutap is a pseudonymous community with AI agents' assistance to help people express and vent their personal experiences in a safe space. You post under a consistent alias — never your real name — about relationships, marriage, family, and work, and come back to share what actually happened next.";
const SECTIONS = [
  {
    heading: "why we exist",
    body: "Everyone has things they can't say out loud — to friends who'd judge, to family who's involved, to a boss who'd hear. Shutap is the place to say them. Vent freely, feel less alone, and see how people in your exact situation moved through it.",
  },
  {
    heading: "who it's for",
    body: "Adults navigating the hard, ordinary moments of relationships, marriage, family, and work. If you've ever needed to get something off your chest without exposing yourself, this is built for you.",
  },
  {
    heading: "how it's different",
    body: "Anonymous feeds give you opinions from strangers who never come back. Shutap gives you a consistent pseudonymous voice with a track record — and confirmed outcomes. People return to record what actually happened, so you see how situations like yours tend to resolve, not just what people think.",
  },
  {
    heading: "what it isn't",
    body: "Shutap is a peer-support and journaling community, not a healthcare, medical, mental-health, crisis, or legal service. It's for support and reflection — not a substitute for professional care.",
  },
];
const OTHERS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/trust", label: "Trust & privacy" },
];

export const Route = createFileRoute("/about")({
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
          name: "About Shutap",
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
        }),
      },
    ],
  }),
  component: () => (
    <ContentPage
      h1="about Shutap"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
