import { OG_IMAGE, OG_IMAGE_ALT } from "@/lib/site";

/**
 * Shared social share image + Twitter card meta. Every public route's
 * head() should spread `...ogImageMeta()` into its `meta` array so link
 * previews use the sitewide 1200×630 OG card instead of falling back to
 * the platform's auto-screenshot.
 */
export function ogImageMeta(): Array<Record<string, string>> {
  return [
    { property: "og:image", content: OG_IMAGE },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: OG_IMAGE_ALT },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: OG_IMAGE },
  ];
}
