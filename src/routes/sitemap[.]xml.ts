import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";
import { OUTCOMES, isOutcomeIndexable } from "@/lib/seo/outcomes";
import { PROFILES, isProfileIndexable } from "@/lib/seo/profiles";
import { listIndexableStoriesForSitemap, getRelateCount } from "@/lib/seo/story.server";
import { STORY_INDEX_MIN_RELATES } from "@/lib/seo/story";
import { renderSitemapIndex } from "@/lib/seo/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const children: { loc: string; lastmod?: string }[] = [
          { loc: `${SITE_URL}/sitemaps/core.xml` },
        ];

        if (OUTCOMES.filter(isOutcomeIndexable).length > 0) {
          children.push({ loc: `${SITE_URL}/sitemaps/outcomes.xml` });
        }
        if (PROFILES.filter(isProfileIndexable).length > 0) {
          children.push({ loc: `${SITE_URL}/sitemaps/profiles.xml` });
        }

        // Stories: only advertise the child sitemap when at least one
        // story qualifies for indexing (seed OR relates >= threshold).
        const storyRows = await listIndexableStoriesForSitemap(5000);
        let storyIndexableCount = 0;
        for (const r of storyRows) {
          if (r.is_seed) { storyIndexableCount++; continue; }
          const c = await getRelateCount(r.room_id);
          if (c >= STORY_INDEX_MIN_RELATES) storyIndexableCount++;
          if (storyIndexableCount > 0) break;
        }
        if (storyIndexableCount > 0) {
          children.push({ loc: `${SITE_URL}/sitemaps/stories.xml` });
        }

        return new Response(renderSitemapIndex(children), {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
