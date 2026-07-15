// Public read for the story SSR route. Wraps the admin-scoped reader in
// a server function so the client bundle never touches supabaseAdmin.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  pillar: z.enum(["relationships", "marriage", "family", "career"]),
  slug: z.string().min(1).max(200),
});

export const getPublicStory = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { getStoryBySlug, listSiblingStories } = await import("@/lib/seo/story.server");
    const hit = await getStoryBySlug(data.pillar, data.slug);
    if (!hit) return null;
    const siblings = await listSiblingStories({
      pillar: data.pillar,
      excludeId: hit.row.id,
      limit: 4,
    });
    return { row: hit.row, relates: hit.relates, siblings };
  });
