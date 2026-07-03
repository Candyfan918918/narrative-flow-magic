import { createFileRoute, Link } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import { getOutcome, isOutcomeIndexable, type OutcomeAggregate } from "@/lib/seo/outcomes";
import { getHub } from "@/lib/seo/hubs";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/what-happens/$slug")({
  loader: ({ params }) => {
    const outcome = getOutcome(params.slug);
    const hub = getHub(params.slug);
    return { outcome, hub: hub ?? null, slug: params.slug };
  },
  head: ({ params, loaderData }) => {
    const url = `/what-happens/${params.slug}`;
    const indexable = isOutcomeIndexable(loaderData?.outcome);
    const title = loaderData?.outcome
      ? `What happens when — ${loaderData.outcome.question} — shutap`
      : "what happens when… — shutap";
    const description = loaderData?.outcome?.headline?.slice(0, 155) ??
      "Confirmed outcomes from real people. Numbered, dated, attributed.";

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
    ];
    if (!indexable) meta.push({ name: "robots", content: "noindex, follow" });

    const scripts =
      indexable && loaderData?.outcome
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Dataset",
                name: `What happens: ${loaderData.outcome.question}`,
                description: loaderData.outcome.headline,
                dateModified: loaderData.outcome.updatedAt,
                creator: { "@type": "Organization", name: "Shutap" },
                variableMeasured: "confirmed outcome",
                measurementTechnique: loaderData.outcome.method,
                size: `${loaderData.outcome.sampleSize} confirmed outcomes`,
              }),
            },
          ]
        : [];

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  component: WhatHappensPage,
  notFoundComponent: () => (
    <SeoPage>
      <h1 className="text-2xl font-semibold">no outcome page for that yet.</h1>
      <p className="mt-3 text-muted-foreground">
        we only publish numbers once enough people confirm what happened.
      </p>
    </SeoPage>
  ),
  errorComponent: ({ reset }) => (
    <SeoPage>
      <h1 className="text-2xl font-semibold">something broke loading this.</h1>
      <button onClick={reset} className="mt-3 underline">try again</button>
    </SeoPage>
  ),
});

function WhatHappensPage() {
  const { outcome, hub, slug } = Route.useLoaderData() as {
    outcome: OutcomeAggregate | undefined;
    hub: ReturnType<typeof getHub> | null;
    slug: string;
  };

  if (!outcome) {
    return (
      <SeoPage>
        <article className="space-y-6">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            what happens when…
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {hub?.question ?? slug.replace(/-/g, " ")}
          </h1>
          <p className="text-lg text-muted-foreground">
            we haven't gathered enough confirmed outcomes to publish a number yet.
            this page will fill in as people share what actually happened next.
          </p>
          {hub && (
            <Link
              to="/is-it-normal/$slug"
              params={{ slug: hub.slug }}
              className="inline-block text-sm underline underline-offset-4"
            >
              read the room for this question →
            </Link>
          )}
        </article>
      </SeoPage>
    );
  }

  return (
    <SeoPage>
      <article className="space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            what happens when…
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{outcome.question}</h1>
          <p className="text-lg leading-relaxed">{outcome.headline}</p>
          <p className="text-xs text-muted-foreground">
            sample size: {outcome.sampleSize} · updated {outcome.updatedAt}
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">how we counted</h2>
          <p className="text-muted-foreground">{outcome.method}</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">what people said happened</h2>
          <ol className="space-y-4">
            {outcome.claims.map((c, i) => (
              <li key={c.id} className="border-l-2 border-border pl-4">
                <p className="text-sm text-muted-foreground">
                  #{i + 1} · {c.date} · <Link to="/u/$pseudonym" params={{ pseudonym: c.by }} className="underline">{c.by}</Link>
                </p>
                <p className="mt-1">{c.claim}</p>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </SeoPage>
  );
}
