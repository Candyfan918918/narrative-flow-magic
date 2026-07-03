import { createFileRoute, notFound } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import {
  getProfile,
  isProfileIndexable,
  profileSignal,
  type PseudonymProfile,
} from "@/lib/seo/profiles";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/u/$pseudonym")({
  loader: ({ params }) => {
    const profile = getProfile(params.pseudonym);
    if (!profile) throw notFound();
    return profile;
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/u/${params.pseudonym}`;
    const indexable = isProfileIndexable(loaderData ?? undefined);
    const title = loaderData
      ? `${loaderData.pseudonym} — shutap`
      : "profile — shutap";
    const description = loaderData
      ? `${loaderData.pseudonym}: ${loaderData.storiesShared} stories shared, ${loaderData.outcomesConfirmed} outcomes confirmed.`
      : "Pseudonymous author profile on Shutap.";

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: url },
    ];
    if (!indexable) meta.push({ name: "robots", content: "noindex, follow" });

    const scripts =
      indexable && loaderData
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                name: loaderData.pseudonym,
                alternateName: loaderData.pseudonym,
                description: loaderData.bio ?? description,
                url,
                memberOf: { "@type": "Organization", name: "Shutap" },
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
  component: ProfilePage,
  notFoundComponent: () => (
    <SeoPage>
      <h1 className="text-2xl font-semibold">no profile here.</h1>
      <p className="mt-3 text-muted-foreground">
        pseudonyms are private until the author chooses to surface.
      </p>
    </SeoPage>
  ),
  errorComponent: ({ reset }) => (
    <SeoPage>
      <h1 className="text-2xl font-semibold">couldn't load this profile.</h1>
      <button onClick={reset} className="mt-3 underline">try again</button>
    </SeoPage>
  ),
});

function ProfilePage() {
  const p = Route.useLoaderData() as PseudonymProfile;
  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            pseudonym
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{p.pseudonym}</h1>
          {p.bio && <p className="text-muted-foreground">{p.bio}</p>}
        </header>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="stories" value={p.storiesShared} />
          <Stat label="outcomes" value={p.outcomesConfirmed} />
          <Stat label="same" value={p.sameCount} />
          <Stat label="halls" value={p.hallsReached.length} />
        </section>

        <p className="text-xs text-muted-foreground">
          joined {p.joinedAt} · signal {profileSignal(p)}
        </p>
      </article>
    </SeoPage>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
