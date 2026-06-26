import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { LEGAL_DISCLAIMER } from "@/lib/seo/legal";

export const Route = createFileRoute("/ai-disclosure")({
  head: () => ({
    meta: [
      { title: "AI Disclosure — Shutap" },
      { name: "description", content: "Shutap's Companion and Mirror are AI. Not a therapist. Not a doctor. Here's what that means." },
      { property: "og:title", content: "AI Disclosure — Shutap" },
      { property: "og:description", content: "You're talking to an AI companion — not a human, not a therapist." },
    ],
    links: [{ rel: "canonical", href: "/ai-disclosure" }],
  }),
  component: AiDisclosurePage,
});

function AiDisclosurePage() {
  return (
    <SeoPage>
      <article className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">ai disclosure</h1>
        <p className="text-lg italic leading-relaxed text-muted-foreground">
          you're talking to shutap's ai companion — not a human, and not a therapist. it's here to listen, reflect, and keep you company. it can get things wrong, and it can't give medical, mental-health, or legal advice. if things feel heavy, we'll point you to real help. 🤍
        </p>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">what's AI on shutap</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>The eye (Companion) that responds when you spill.</li>
            <li>The Mirror — patterns and reflections over time, for subscribers.</li>
            <li>Match-making (Resonance) that finds rooms that sound like yours.</li>
            <li>The Scrubber that removes personal identifiers from your stories before they're stored.</li>
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">the rules our AI follows</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Never diagnoses, prescribes, or directs.</li>
            <li>Routes anything serious to real human help (see <a href="/safety" className="underline">/safety</a>).</li>
            <li>Treats crisis content as private — excluded from public display and from our aggregated corpus.</li>
          </ul>
        </section>
        <p className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          {LEGAL_DISCLAIMER}
        </p>
      </article>
    </SeoPage>
  );
}
