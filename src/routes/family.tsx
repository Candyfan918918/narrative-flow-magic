import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { HUBS_BY_PILLAR } from "@/lib/seo/hubs";

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
            {HUBS_BY_PILLAR.family.map((h) => (
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
