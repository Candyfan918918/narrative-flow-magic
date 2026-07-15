import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, type SitemapEntry } from "@/lib/seo/sitemap";
import { listIndexableStoriesForSitemap } from "@/lib/seo/story.server";

export const Route = createFileRoute("/sitemaps/stories.xml")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await listIndexableStoriesForSitemap(5000);
        if (rows.length === 0) {
          return new Response("Not Found", { status: 404 });
        }
        const entries: SitemapEntry[] = rows.map((r) => ({
          path: `/story/${r.pillar}/${r.slug}`,
          lastmod: r.updated_at,
          changefreq: "weekly",
          priority: "0.7",
        }));
        return new Response(renderUrlset(entries), {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=900",
          },
        });
      },
    },
  },
});
