import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { HUBS_BY_PILLAR } from "@/lib/seo/hubs";

const TITLE = "Marriage — vent about the long-haul stuff, pseudonymously";
const DESCRIPTION =
  "Real stories about marriage: roommate energy, resentment, repair, leaving, staying. Pseudonymous, with confirmed outcomes from people who've lived it.";

export const Route = createFileRoute("/marriage")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/marriage" },
    ],
    links: [{ rel: "canonical", href: "/marriage" }],
  }),
  component: MarriagePillar,
});

function MarriagePillar() {
  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            Pillar
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Marriage</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            The long-haul stuff: roommate energy, resentment, repair, leaving,
            staying. The thing you can't say out loud at brunch.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common questions people bring here</h2>
          <ul className="space-y-2">
            {HUBS_BY_PILLAR.marriage.map((h) => (
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
