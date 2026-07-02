import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";

const URL = `${SITE_URL}/ai-disclosure`;
const TITLE = "AI at Shutap — what the AI does, and what it doesn't";
const DESCRIPTION =
  "Shutap uses AI to help you express yourself and power the companion and Mirror. What the AI does, what it isn't, that it can be wrong, and which models we use.";
const CAPSULE =
  "Shutap uses AI to help you express yourself and to power features like the companion and the Mirror. Here's exactly what the AI does, and what it doesn't.";

const SECTIONS = [
  { heading: "What the AI does", body: "AI agents help you find the words for what you're feeling, reflect your story back to you, and power the Mirror's view of your patterns over time. The stories are yours; the AI guides, it doesn't author them for you." },
  { heading: "What the AI is not", body: "The AI is not a human, a therapist, a doctor, or a lawyer, and never claims to be. It cannot give medical, psychological, or legal advice, diagnosis, or treatment." },
  { heading: "It can be wrong", body: "AI responses are generated automatically and can be inaccurate, incomplete, or off-base. Use your own judgment; don't rely on AI output for important decisions." },
  { heading: "Which AI we use", body: "Companion and Mirror responses are generated using Anthropic's Claude models. Under Anthropic's commercial API terms, your inputs are not used to train their models. See our Privacy Policy for how your data is handled." },
  { heading: "Crisis handling", body: "If something serious comes up, the AI stops and points you to real human help rather than trying to handle it itself." },
];

const OTHERS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/guidelines", label: "Community guidelines" },
  { href: "/safety", label: "Safety" },
  { href: "/faq", label: "FAQ" },
  { href: "/legal", label: "Legal & policies" },
];

export const Route = createFileRoute("/ai-disclosure")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: URL,
        }),
      },
    ],
  }),
  component: () => (
    <ContentPage
      h1="how we use AI"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
