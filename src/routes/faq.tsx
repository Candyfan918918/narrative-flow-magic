import { createFileRoute } from "@tanstack/react-router";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";

const PATH = "/faq";
const URL = `${SITE_URL}/faq`;
const TITLE =
  "Shutap FAQ — is it therapy, is it anonymous, is data safe?";
const DESCRIPTION =
  "Answers about Shutap: what it is, how your privacy is protected, whether it's therapy (it isn't), who can see your stories, and how to delete your data.";
const CAPSULE =
  "Shutap is a pseudonymous community with AI agents' assistance to help people express and vent their personal experiences in a safe space. Here are the questions people ask most before they spill.";

const QA: { heading: string; body: string }[] = [
  { heading: "What is Shutap?", body: "Shutap is a pseudonymous online community where people vent about relationships, marriage, family, and work under a consistent alias — and, unlike anonymous feeds, come back to share what actually happened next. AI agents help you find the words. It's a place to feel heard and less alone." },
  { heading: "Is Shutap therapy or a mental-health service?", body: "No. Shutap is a peer-support and journaling community, not a healthcare, medical, mental-health, crisis, or legal service. Nothing on Shutap — including anything the AI says — is medical, psychological, or legal advice, diagnosis, or treatment. It's for support and reflection, not a substitute for professional care." },
  { heading: "Is Shutap anonymous?", body: "Shutap is pseudonymous, which is stronger for you than fully anonymous. You post under a consistent alias, never your real name. Full anonymity isn't guaranteed against lawful legal process, but your real name is never shown to other users." },
  { heading: "How is my privacy protected? Will my real name show?", body: "Your real name never appears. Before anything you write is stored, an automatic scrubber removes personal identifiers — names, addresses, specific locations, phone numbers, emails — and only the scrubbed version is kept. Crisis messages are never made public." },
  { heading: "Is Shutap free?", body: "Yes — reading stories, venting, and getting a response are free. A paid subscription (the Mirror) is optional and adds a private, evolving view of your own patterns over time. You're never charged to be heard." },
  { heading: "Who can see what I post?", body: "Only content you choose to make public appears to the community, always in scrubbed, de-identified form. Private entries stay private. Crisis-flagged messages are never shown publicly." },
  { heading: "Is the AI companion a therapist?", body: "No. The companion is AI — not a human and not a therapist. It listens and reflects, can get things wrong, and can't give medical, mental-health, or legal advice. When something feels serious, it points you to real human help." },
  { heading: "Are the stories real? Are they written by AI?", body: "Stories are written by real people about their real lives. AI agents help you get it out and reflect it back, but don't write your story or pose as a person." },
  { heading: "What is the Mirror?", body: "The Mirror is Shutap's optional paid subscription: a private view of the patterns in your own stories over time. It observes and reflects — it never diagnoses, prescribes, or tells you what to do." },
  { heading: "How does Shutap keep me safe in a crisis?", body: "Shutap isn't a crisis service, but it's built to respond. When the companion notices something serious, it stops and routes you to real help: in the US, call or text 988; in the UK, Samaritans at 116 123; anywhere, findahelpline.com. Crisis messages are kept private." },
  { heading: "Can I delete my stories or account?", body: "Yes, anytime. From Account & Data settings you can edit or delete any story, export your data, and delete your account. You can also email privacy@shutap.com." },
  { heading: "Do you sell my data?", body: "No. Shutap does not sell your personal information. Aggregated insights are always de-identified, and crisis content is excluded entirely and never monetized." },
  { heading: "Who can use Shutap?", body: "Shutap is for adults 18 and older." },
  { heading: "How is Shutap different from Reddit, AITA, or Quora?", body: "Anonymous feeds give opinions from strangers who never come back. Shutap gives you a consistent pseudonymous voice with a track record — and confirmed outcomes: people return to record what actually happened, so you can see how situations like yours tend to resolve." },
];

const OTHERS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/guidelines", label: "Community guidelines" },
  { href: "/safety", label: "Safety" },
  { href: "/ai-disclosure", label: "AI disclosure" },
  { href: "/legal", label: "Legal & policies" },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      ...ogImageMeta(),
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: QA.map((q) => ({
            "@type": "Question",
            name: q.heading,
            acceptedAnswer: { "@type": "Answer", text: q.body },
          })),
        }),
      },
    ],
  }),
  component: () => (
    <ContentPage
      h1="frequently asked questions"
      capsule={CAPSULE}
      sections={QA}
      others={OTHERS}
    />
  ),
});
