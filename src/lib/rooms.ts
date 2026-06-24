import { supabase } from "@/integrations/supabase/client";
import type { Hall, Reactions, Room } from "@/lib/shutap-data";

export type DbRoom = {
  id: string;
  author_id: string;
  alias: string;
  emoji: string;
  title: string;
  body: string;
  support: "heard" | "advice";
  hall: Hall;
  reflection: string | null;
  created_at: string;
};

/** Turn a body into a short "title-ish" line. */
function deriveTitle(body: string): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  const firstSentence = trimmed.split(/[.!?]\s/)[0] ?? trimmed;
  return firstSentence.length > 110 ? firstSentence.slice(0, 107) + "…" : firstSentence;
}

function guessHall(body: string): Hall {
  const t = body.toLowerCase();
  if (/(told|cried|therap|healed|finally|softer)/.test(t)) return "healing";
  if (/(quit|left|stood|said no|brave|first time)/.test(t)) return "brave";
  if (/(love|mum|mom|dad|sister|brother|partner|husband|wife)/.test(t)) return "loving";
  return "relatable";
}

export async function createRoomFromDraft(input: {
  body: string;
  alias: string;
  emoji: string;
  support?: "heard" | "advice";
  hall?: Hall;
}): Promise<DbRoom> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const row = {
    author_id: u.user.id,
    alias: input.alias,
    emoji: input.emoji,
    title: deriveTitle(input.body),
    body: input.body,
    support: input.support ?? "heard",
    hall: input.hall ?? guessHall(input.body),
    reflection: null,
  };
  const { data, error } = await supabase
    .from("rooms")
    .insert(row)
    .select("id,author_id,alias,emoji,title,body,support,hall,reflection,created_at")
    .single();
  if (error) throw error;
  return data as DbRoom;
}

export async function fetchRoomById(id: string): Promise<DbRoom | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("id,author_id,alias,emoji,title,body,support,hall,reflection,created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as DbRoom | null) ?? null;
}

export async function fetchRoomCounts(id: string): Promise<{ relates: number; sitting: number; reactions: Reactions }> {
  const [{ count: relates }] = await Promise.all([
    supabase.from("room_relates").select("*", { count: "exact", head: true }).eq("room_id", id),
  ]);
  // Reactions aren't readable across users (RLS read-own), so this is best-effort 0 for now.
  return {
    relates: relates ?? 0,
    sitting: 1,
    reactions: { heard: 1, same: 1, strong: 1, time: 1, brave: 1 },
  };
}

export function dbRoomToRoom(db: DbRoom, counts: { relates: number; sitting: number; reactions: Reactions }): Room {
  const ms = Date.now() - new Date(db.created_at).getTime();
  const hours = Math.max(1, Math.round(ms / 3.6e6));
  const hoursLabel = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
  return {
    id: db.id,
    alias: db.alias,
    emoji: db.emoji,
    title: db.title,
    support: db.support,
    relates: counts.relates,
    sitting: counts.sitting,
    hours: hoursLabel,
    reactions: counts.reactions,
    body: db.body,
    reflection: db.reflection ?? "this room is still finding its words.",
    hall: db.hall,
  };
}

/** Match seed IDs (0..N) so legacy demo rooms keep working. */
export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export async function toggleRelate(roomId: string): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("sign in to relate");
  const { data: existing } = await supabase
    .from("room_relates")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("room_relates").delete().eq("room_id", roomId).eq("user_id", u.user.id);
    return false;
  }
  await supabase.from("room_relates").insert({ room_id: roomId, user_id: u.user.id });
  return true;
}
