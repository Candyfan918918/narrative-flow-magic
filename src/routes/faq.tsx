import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/faq";
const URL = `${SITE_URL}/faq`;
const TITLE = "Shutap FAQ — is it therapy, is it pseudonymous, is my data safe?";
const DESCRIPTION =
  "answers about shutap: what it is, how the cards are written, why it's pseudonymous, whether it's therapy (it isn't), and how to delete your data.";
const CAPSULE =
  "you type what happened. shutap writes you a set of joke cards — every card a different angle on the same situation. here are the questions people ask first.";

const QA: { heading: string; body: string }[] = [
  { heading: "What is Shutap?", body: "You type what happened — the comment at dinner, the text at 11pm, the meeting you weren't invited to — and Shutap writes you a set of joke cards. Each card takes a different comedic angle on the same situation. You flip them one at a time and keep the ones that land." },
  { heading: "Is Shutap therapy or a mental-health service?", body: "No. Shutap writes jokes, not prescriptions. It is an entertainment service, not a healthcare, medical, mental-health, crisis, or legal service. Nothing here is advice, diagnosis, or treatment." },
  { heading: "Is Shutap pseudonymous?", body: "You get a name — something like Feral Norwegian Heron. It sticks across your sets, and it is not yours. Your real name is never shown. Names, addresses, workplaces and other identifying details are stripped before anything is stored." },
  { heading: "Who writes the cards?", body: "The cards are written by AI, not by a person. Nobody is standing by to reply. The AI can get things wrong, and it cannot give medical, mental-health, or legal advice." },
  { heading: "What can I bring here?", body: "Family, partners, exes, roommates, managers, landlords, the friend who's been doing the thing for nine years, the stranger who felt like commenting. Big things and extremely small ones." },
  { heading: "Is Shutap free?", body: "Yes — typing your situation and reading your set are free. The Mirror is an optional subscription ($7.99/month or $49.99/year) that records what keeps coming back and reads it to you." },
  { heading: "Does the joke ever go at me?", body: "No. The joke goes at the situation, never at the person telling it, and it never points at a real person and calls them a name." },
  { heading: "Who can see what I write?", body: "Only what you choose to post appears publicly, always in scrubbed, de-identified form. Anything flagged as heavy is kept private and never published." },
  { heading: "What if something is genuinely heavy?", body: "Shutap stops joking. It isn't a crisis service, but it routes you to real help: in the US call or text 988; in the UK, Samaritans at 116 123; anywhere, findahelpline.com." },
  { heading: "What is the Mirror?", body: "The Mirror is the paid part: a private record of the cards you've flipped and what keeps repeating — same person, same week of the month, same move. It observes; it never diagnoses or tells you what to do." },
  { heading: "Can I delete my sets or account?", body: "Yes, anytime. From Account & Data settings you can delete any set, export your data, and delete your account. You can also email privacy@shutap.com." },
  { heading: "Do you sell my data?", body: "No. Shutap does not sell your personal information." },
  { heading: "Who can use Shutap?", body: "Adults 18 and older." },
];

const OTHERS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/guidelines", label: "House rules" },
  { href: "/safety", label: "If it\u2019s heavy" },
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
      breadcrumbScript([{ name: "FAQ", path: "/faq" }]),
    ],
  }),
  component: () => (
    <ContentPage
      breadcrumbs={[{ name: "FAQ", path: "/faq" }]}
      h1="frequently asked questions"
      capsule={CAPSULE}
      sections={QA}
      others={OTHERS}
      nosnippetCapsule
    />
  ),
});
