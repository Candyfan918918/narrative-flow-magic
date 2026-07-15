// Public story reader — server-only helpers used by the /story route and
// the stories sitemap. Every read goes through the service-role client so
// column-level revokes on situations.alias_id are respected and the field
// is never returned to the client.
import type { PillarSlug, StoryRow } from "@/lib/seo/story";
import { isStoryRenderable } from "@/lib/seo/story";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const SELECT =
  "id, slug, pillar, clean_text, title, initial_scan, scan_band, scan_reasoning, is_public, is_seed, crisis_flag, deleted_at, room_id, created_at, updated_at";

function coerce(row: Record<string, unknown> | null): StoryRow | null {
  if (!row) return null;
  return row as unknown as StoryRow;
}

export async function getRelateCount(roomId: string | null): Promise<number> {
  if (!roomId) return 0;
  const sb = await admin();
  const { count } = await sb
    .from("room_relates")
    .select("room_id", { count: "exact", head: true })
    .eq("room_id", roomId);
  return count ?? 0;
}

export async function getStoryBySlug(pillar: PillarSlug, slug: string): Promise<{
  row: StoryRow;
  relates: number;
} | null> {
  const sb = await admin();
  const { data } = await sb
    .from("situations")
    .select(SELECT)
    .eq("pillar", pillar)
    .eq("slug", slug)
    .maybeSingle();
  const row = coerce(data as Record<string, unknown> | null);
  if (!row) return null;
  if (!isStoryRenderable({
    is_public: row.is_public,
    is_seed: row.is_seed,
    crisis_flag: row.crisis_flag,
    deleted_at: row.deleted_at,
  })) return null;
  const relates = await getRelateCount(row.room_id);
  return { row, relates };
}

export async function listSiblingStories(args: {
  pillar: PillarSlug;
  excludeId: string;
  limit?: number;
}): Promise<Array<Pick<StoryRow, "id" | "slug" | "pillar" | "title" | "clean_text" | "initial_scan">>> {
  const sb = await admin();
  const { data } = await sb
    .from("situations")
    .select("id, slug, pillar, title, clean_text, initial_scan, is_public, crisis_flag, deleted_at")
    .eq("pillar", args.pillar)
    .eq("is_public", true)
    .eq("crisis_flag", false)
    .is("deleted_at", null)
    .not("slug", "is", null)
    .neq("id", args.excludeId)
    .order("created_at", { ascending: false })
    .limit((args.limit ?? 4) * 3);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  return rows.slice(0, args.limit ?? 4) as never;
}

/** Rows eligible to appear in the stories sitemap (real, non-seed only). */
export async function listIndexableStoriesForSitemap(limit = 5000): Promise<
  Array<{ pillar: PillarSlug; slug: string; updated_at: string }>
> {
  const sb = await admin();
  const { data } = await sb
    .from("situations")
    .select("pillar, slug, updated_at")
    .eq("is_public", true)
    .eq("crisis_flag", false)
    .eq("is_seed", false)
    .is("deleted_at", null)
    .not("slug", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    pillar: r.pillar as PillarSlug,
    slug: String(r.slug),
    updated_at: String(r.updated_at),
  }));
}

/** Count of real (non-seed) stories eligible for indexing. */
export async function countIndexableStories(): Promise<number> {
  const sb = await admin();
  const { count } = await sb
    .from("situations")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true)
    .eq("crisis_flag", false)
    .eq("is_seed", false)
    .is("deleted_at", null)
    .not("slug", "is", null);
  return count ?? 0;
}
