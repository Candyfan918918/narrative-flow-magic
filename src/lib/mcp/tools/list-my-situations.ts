import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_my_situations",
  title: "List my situations",
  description:
    "List the signed-in user's own Shutap situations (spills), newest first. Returns id, pillar, clean_text, scan, status, and created_at.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max rows to return (default 20)."),
    pillar: z
      .enum(["relationships", "marriage", "family", "career"])
      .optional()
      .describe("Filter by life pillar."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, pillar }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: alias, error: aliasErr } = await supabase
      .from("aliases")
      .select("id")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (aliasErr) {
      return { content: [{ type: "text", text: aliasErr.message }], isError: true };
    }
    if (!alias) {
      return {
        content: [{ type: "text", text: "No Shutap alias yet — sign in to the app once to create one." }],
        structuredContent: { rows: [] },
      };
    }
    let q = supabase
      .from("situations")
      .select("id, pillar, clean_text, initial_scan, status, created_at")
      .eq("alias_id", alias.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (pillar) q = q.eq("pillar", pillar);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
