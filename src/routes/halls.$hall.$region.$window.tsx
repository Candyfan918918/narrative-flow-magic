import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { SeoPage } from "@/components/seo/SeoPage";
import {
  HALLS,
  MIN_HALL_ENTRIES,
  getHallView,
  isValidHall,
  isValidRegion,
  isValidWindow,
  type HallSlug,
  type Region,
  type Window as HallWindow,
  type HallView,
} from "@/lib/seo/halls";

export const Route = createFileRoute("/halls/$hall/$region/$window")({
  loader: ({ params }) => {
    if (
      !isValidHall(params.hall) ||
      !isValidRegion(params.region) ||
      !isValidWindow(params.window)
    ) {
      throw notFound();
    }
    const hall = params.hall as HallSlug;
    const region = params.region as Region;
    const window = params.window as HallWindow;
    const view = getHallView(hall, region, window);
    return { hall, region, window, view };
  },
  head: ({ params, loaderData }) => {
    const url = `/halls/${params.hall}/${params.region}/${params.window}`;
    const indexable =
      !!loaderData?.view && loaderData.view.entries.length >= MIN_HALL_ENTRIES;
    const meta = loaderData
      ? loaderData.hall
      : (params.hall as string);
    const hallMeta = isValidHall(params.hall) ? HALLS[params.hall as HallSlug] : null;
    const title = hallMeta
      ? `${hallMeta.title} · ${params.region} · ${params.window} — shutap halls`
      : "halls — shutap";
    const description = hallMeta?.blurb ?? "Shutap halls — curated collections of rooms.";

    const metaTags: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
    ];
    if (!indexable) metaTags.push({ name: "robots", content: "noindex, follow" });
    void meta;

    const scripts =
      indexable && loaderData?.view
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: title,
                numberOfItems: loaderData.view.entries.length,
                itemListElement: loaderData.view.entries
                  .slice(0, 25)
                  .map((e, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: e.title,
                    url: e.href,
                  })),
              }),
            },
          ]
        : [];

    return {
      meta: metaTags,
      links: [{ rel: "canonical", href: url }],
      scripts,
    };
  },
  component: HallPage,
  notFoundComponent: () => (
    <SeoPage>
      <h1 className="text-2xl font-semibold">no hall at that path.</h1>
      <p className="mt-3 text-muted-foreground">
        try{" "}
        <Link to="/halls/$hall/$region/$window" params={{ hall: "most-related", region: "global", window: "30d" }} className="underline">
          most-related · global · 30d
        </Link>
        .
      </p>
    </SeoPage>
  ),
  errorComponent: ({ reset }) => (
    <SeoPage>
      <h1 className="text-2xl font-semibold">couldn't load this hall.</h1>
      <button onClick={reset} className="mt-3 underline">try again</button>
    </SeoPage>
  ),
});

function HallPage() {
  const { hall, region, window, view } = Route.useLoaderData() as {
    hall: HallSlug;
    region: Region;
    window: HallWindow;
    view: HallView | undefined;
  };
  const meta = HALLS[hall];

  return (
    <SeoPage>
      <article className="space-y-8">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">
            hall · {region} · {window}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
          <p className="text-muted-foreground">{meta.blurb}</p>
        </header>

        {!view || view.entries.length === 0 ? (
          <p className="text-muted-foreground">
            we haven't gathered enough signal here yet. halls publish once at least{" "}
            {MIN_HALL_ENTRIES} rooms qualify for a (region, window) cell.
          </p>
        ) : (
          <ol className="space-y-3">
            {view.entries.map((e, i) => (
              <li key={e.id} className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
                <span className="flex gap-3">
                  <span className="tabular-nums text-muted-foreground">{i + 1}.</span>
                  <a href={e.href} className="underline-offset-4 hover:underline">
                    {e.title}
                  </a>
                </span>
                <span className="text-xs text-muted-foreground">{e.metric}</span>
              </li>
            ))}
          </ol>
        )}
      </article>
    </SeoPage>
  );
}
