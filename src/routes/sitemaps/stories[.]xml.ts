import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { renderUrlset, type SitemapEntry } from "@/lib/seo/sitemap";
import { listIndexableStoriesForSitemap, getRelateCount } from "@/lib/seo/story.server";
import { STORY_INDEX_MIN_RELATES } from "@/lib/seo/story";

export const Route = createFileRoute("/sitemaps/stories.xml")({
  server: {
    handlers: {
      GET: async () => {
        const rows = await listIndexableStoriesForSitemap(5000);
        // Compute relate counts in batches — sitemap is served with short cache.
        const withCounts = await Promise.all(
          rows.map(async (r) => ({ ...r, relates: await getRelateCount(r.room_id) })),
        );
        const indexable = withCounts.filter(
          (r) => r.is_seed || r.relates >= STORY_INDEX_MIN_RELATES,
        );
        if (indexable.length === 0) {
          return new Response("Not Found", { status: 404 });
        }
        const entries: SitemapEntry[] = indexable.map((r) => ({
          path: `/story/${r.pillar}/${r.slug}`,
          lastmod: r.updated_at,
          changefreq: "weekly",
          priority: "0.7",
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
