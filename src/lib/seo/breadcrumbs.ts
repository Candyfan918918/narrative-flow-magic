import { SITE_URL } from "@/lib/site";

/**
 * Shared BreadcrumbList JSON-LD builder.
 *
 * Google reads BreadcrumbList to understand a site's hierarchy (and renders
 * it as the path line above mobile results). `item` MUST be an absolute URL
 * — relative paths like "/" are not reliably resolved — so every crumb path
 * is prefixed with SITE_URL here.
 *
 * Pass paths (e.g. "/family"), not full URLs. A "Home" crumb is prepended
 * automatically, so callers only list the trail below the root.
 */
export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(trail: Crumb[]): Record<string, unknown> {
  const items: Crumb[] = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path === "/" ? "/" : c.path}`,
    })),
  };
}

/** Convenience wrapper: the `scripts` entry for a route's head(). */
export function breadcrumbScript(trail: Crumb[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(breadcrumbJsonLd(trail)),
  };
}

export const PILLAR_LABELS: Record<string, string> = {
  relationships: "Relationships",
  marriage: "Marriage",
  family: "Family",
  career: "Career",
};
