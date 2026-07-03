import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { OUTCOMES, isOutcomeIndexable } from "@/lib/seo/outcomes";
import { renderUrlset, type SitemapEntry } from "@/lib/seo/sitemap";

export const Route = createFileRoute("/sitemaps/outcomes.xml")({
  server: {
    handlers: {
      GET: async () => {
        const indexable = OUTCOMES.filter(isOutcomeIndexable);
        if (indexable.length === 0) {
          return new Response("Not Found", { status: 404 });
        }
        const entries: SitemapEntry[] = indexable.map((o) => ({
          path: `/what-happens/${o.slug}`,
          lastmod: o.updatedAt,
          changefreq: "weekly",
          priority: "0.8",
        }));
        return new Response(renderUrlset(entries), {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
