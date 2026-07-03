import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";
import { HUBS } from "@/lib/seo/hubs";
import { OUTCOMES, isOutcomeIndexable } from "@/lib/seo/outcomes";
import { PROFILES, isProfileIndexable } from "@/lib/seo/profiles";

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

// Public, indexable URLs only. Excluded on purpose:
//   /methodology  → 301 to /how-it-works (consolidated)
//   /contact, /report → utility/intake, not indexable content
//   /halls/*      → gated per (hall, region, window) cell; noindex below threshold
//   app/admin/private routes (see robots.txt Disallow list)
const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/lived-intelligence", changefreq: "monthly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/trust", changefreq: "monthly", priority: "0.6" },
  { path: "/relationships", changefreq: "weekly", priority: "0.9" },
  { path: "/marriage", changefreq: "weekly", priority: "0.9" },
  { path: "/family", changefreq: "weekly", priority: "0.9" },
  { path: "/career", changefreq: "weekly", priority: "0.9" },
  { path: "/halls", changefreq: "weekly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/guidelines", changefreq: "yearly", priority: "0.4" },
  { path: "/safety", changefreq: "yearly", priority: "0.4" },
  { path: "/ai-disclosure", changefreq: "yearly", priority: "0.4" },
  { path: "/legal", changefreq: "yearly", priority: "0.3" },
  ...HUBS.map((h) => ({
    path: `/is-it-normal/${h.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
  })),
  ...OUTCOMES.filter(isOutcomeIndexable).map((o) => ({
    path: `/what-happens/${o.slug}`,
    lastmod: o.updatedAt,
    changefreq: "weekly" as const,
    priority: "0.8",
  })),
  ...PROFILES.filter(isProfileIndexable).map((p) => ({
    path: `/u/${p.pseudonym}`,
    changefreq: "weekly" as const,
    priority: "0.5",
  })),
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${SITE_URL}${e.path}</loc>`,
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
