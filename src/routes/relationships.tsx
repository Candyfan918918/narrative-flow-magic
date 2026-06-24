import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

const TITLE = "Relationships — vent about dating, partners, breakups";
const DESCRIPTION =
  "Real stories from real people about dating, partners, situationships, and breakups. Pseudonymous, no upvotes, no judgment-as-a-feature.";

export const Route = createFileRoute("/relationships")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/relationships" },
    ],
    links: [{ rel: "canonical", href: "/relationships" }],
  }),
  component: RelationshipsPillar,
});

function RelationshipsPillar() {
  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Pillar
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Relationships</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Dating, partners, situationships, breakups, the gray area in between.
            Spill what's actually going on — someone in here has lived your exact
            thing.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common questions people bring here</h2>
          <ul className="space-y-2">
            <li>Is it normal to feel lonely in a relationship?</li>
            <li>Am I overreacting, or is this a red flag?</li>
            <li>Why do I feel guilty after going no-contact?</li>
            <li>Is it bad that I went through his phone?</li>
            <li>How do you know when you've outgrown someone?</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Individual situation hubs publish once we have enough confirmed
            outcomes from real members.
          </p>
        </section>
      </article>
    </SeoPage>
  );
}
