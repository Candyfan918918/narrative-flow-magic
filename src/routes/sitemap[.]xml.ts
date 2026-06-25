import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { HUBS } from "@/lib/seo/hubs";
import { OUTCOMES, isOutcomeIndexable } from "@/lib/seo/outcomes";
import { PROFILES, isProfileIndexable } from "@/lib/seo/profiles";

// TODO: replace with your project URL once a project name or custom domain is set.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/methodology", changefreq: "monthly", priority: "0.6" },
  { path: "/trust", changefreq: "monthly", priority: "0.6" },
  { path: "/relationships", changefreq: "weekly", priority: "0.9" },
  { path: "/marriage", changefreq: "weekly", priority: "0.9" },
  { path: "/family", changefreq: "weekly", priority: "0.9" },
  { path: "/career", changefreq: "weekly", priority: "0.9" },
  ...HUBS.map((h) => ({
    path: `/is-it-normal/${h.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
  })),
  // Phase 3: only list outcome aggregates that pass the §8 indexability gate.
  ...OUTCOMES.filter(isOutcomeIndexable).map((o) => ({
    path: `/what-happens/${o.slug}`,
    lastmod: o.updatedAt,
    changefreq: "weekly" as const,
    priority: "0.8",
  })),
  // Phase 3: only list pseudonym profiles with enough author signal.
  ...PROFILES.filter(isProfileIndexable).map((p) => ({
    path: `/u/${p.pseudonym}`,
    changefreq: "weekly" as const,
    priority: "0.5",
  })),
  // /halls/* and /report are intentionally not listed:
  //   halls are gated per (hall, region, window) cell and emit noindex
  //   below threshold; /report is a takedown intake and is always noindex.
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
