import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { HUBS_BY_PILLAR } from "@/lib/seo/hubs";

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
            {HUBS_BY_PILLAR.relationships.map((h) => (
              <li key={h.slug}>
                <Link
                  to="/is-it-normal/$slug"
                  params={{ slug: h.slug }}
                  className="underline-offset-4 hover:underline"
                >
                  {h.question}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </SeoPage>
  );
}
