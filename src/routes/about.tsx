import { createFileRoute } from "@tanstack/react-router";
import { ogImageMeta } from "@/lib/seo/meta";
import { ContentPage } from "@/components/seo/ContentPage";
import { SITE_URL } from "@/lib/site";
import { breadcrumbScript } from "@/lib/seo/breadcrumbs";

const PATH = "/about";
const TITLE = "what shutap is — Shutap";
const DESCRIPTION =
  "you have the material. shutap does the writing part. jokes about the situation, never about you. pseudonymous, 18+, not therapy.";
const CAPSULE =
  "shutap is where you take the thing that's been living in your head — the comment at dinner, the text at 11pm, the meeting you weren't invited to, the friend who did it again — and turn it into a joke. you type it. shutap writes you a set. every card is a different angle on the same mess: the one that finds the absurd detail, the one that names the pattern, the one that plays the whole thing back as a nature documentary. you flip them one at a time. the ones that land, you keep. the ones that really land, you send.";
const SECTIONS = [
  {
    heading: "this is what comedians do",
    body: "every comedian you like is doing this on purpose. the divorce, the parent who calls at 6am, the job that ate four years — they take the worst thing that happened to them, walk it up to a microphone, and get paid. the bad thing doesn't get smaller. it becomes material. you already have the material. most people just never do the second part, because writing a joke about your own life at 11pm while you're still furious is genuinely hard. shutap does that part.",
  },
  {
    heading: "anything is material",
    body: "family, partners, exes, roommates, managers, landlords, the friend who's been doing the thing for nine years, the stranger who felt like commenting. big things and extremely small ones. there's no category to pick and no bar to clear. if it's still in your head at midnight, it's material.",
  },
  {
    heading: "why it works",
    body: "you've already told this story to your best friend, your sister, and everyone in the thread, and all three said the same three things: that's insane, you're not crazy, have you tried talking to them. a joke does something none of that does. it moves you from inside the thing to above it. you stop being the person it happened to and start being the person telling it. the second it's funny, it isn't in charge of you anymore. nobody here is going to tell you how to feel about it. you'll just notice, somewhere around the third card, that you're laughing.",
  },
  {
    heading: "the rules of the joke",
    body: "the joke is about the situation. never about you. shutap doesn't make fun of your pain and it won't point at a person and call them a name. it goes after the absurdity — the logic of someone who \u201cjust happened to be in the area\u201d from four hours away, the physics of a manager who can find your calendar but not your name. you're the comedian here. shutap just writes the set.",
  },
  {
    heading: "pseudonymous, not nameless",
    body: "you get a name. something like Feral Norwegian Heron. it's yours, it sticks, and it isn't yours. nameless means nothing carries over. pseudonymous means everything does — your sets stack up under one name, which is the whole reason shutap can eventually tell you what keeps happening to you. names, addresses, workplaces and anything else identifying get stripped before a word is stored.",
  },
  {
    heading: "what shutap is not",
    body: "not therapy. not advice. not a place where a stranger tells you what to do about your life. shutap observes and it jokes. it doesn't diagnose you, prescribe anything, or give you instructions. if you're looking to be told what to do, this is the wrong website. and if something is genuinely heavy, shutap stops joking and points you at real help — a punchline is not what that moment needs.",
  },
  {
    heading: "the mirror",
    body: "flip enough cards and a second thing starts happening. shutap starts noticing what comes back. same person, same week of the month, same move. that's the mirror. it records what you've lived and reads it back to you — sharp, specific, using your own numbers. it's the paid part. it's also the part nobody else can copy, because every other app throws this away the second you close the tab.",
  },
  {
    heading: "18+",
    body: "adult space. adult language. adult problems.",
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
          name: "what shutap is",
          description: DESCRIPTION,
          url: `${SITE_URL}${PATH}`,
        }),
      },
      breadcrumbScript([{ name: "About", path: PATH }]),
    ],
  }),
  component: () => (
    <ContentPage
      breadcrumbs={[{ name: "About", path: PATH }]}
      h1="what shutap is"
      capsule={CAPSULE}
      sections={SECTIONS}
      others={OTHERS}
    />
  ),
});
