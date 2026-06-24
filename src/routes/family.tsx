import { createFileRoute } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";

const TITLE = "Family — vent about parents, siblings, in-laws";
const DESCRIPTION =
  "Real stories about family: parents, siblings, in-laws, the family group chat, the guilt. Pseudonymous, with outcomes from people who've been there.";

export const Route = createFileRoute("/family")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/family" },
    ],
    links: [{ rel: "canonical", href: "/family" }],
  }),
  component: FamilyPillar,
});

function FamilyPillar() {
  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Pillar
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Family</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Parents, siblings, in-laws, the family group chat, the guilt. The
            stuff you'd never post on a feed that knows your last name.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common questions people bring here</h2>
          <ul className="space-y-2">
            <li>Is it normal to not like my own mother?</li>
            <li>How do I set boundaries with my parents without the guilt?</li>
            <li>Am I wrong for not inviting a family member to my wedding?</li>
            <li>Is it okay to go low-contact with toxic parents?</li>
            <li>Why does my family make me feel small?</li>
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
