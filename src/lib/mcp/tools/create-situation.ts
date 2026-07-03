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
  name: "create_situation",
  title: "Create a situation (spill)",
  description:
    "Create a new Shutap situation (spill) for the signed-in user. The text is stored privately unless is_public is true.",
  inputSchema: {
    clean_text: z.string().trim().min(1).max(4000).describe("The situation text to record."),
    pillar: z
      .enum(["relationships", "marriage", "family", "career"])
      .describe("Life pillar the situation belongs to."),
    is_public: z.boolean().optional().describe("Whether to publish to the community stream (default false)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ clean_text, pillar, is_public }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: alias, error: aliasErr } = await supabase
      .from("aliases")
      .select("id")
      .eq("user_id", ctx.getUserId())
      .maybeSingle();
    if (aliasErr) return { content: [{ type: "text", text: aliasErr.message }], isError: true };
    if (!alias) {
      return {
        content: [
          {
            type: "text",
            text: "No Shutap alias yet — open the app once and finish onboarding before spilling.",
          },
        ],
        isError: true,
      };
    }
    const { data, error } = await supabase
      .from("situations")
      .insert({
        alias_id: alias.id,
        clean_text,
        pillar,
        is_public: is_public ?? false,
      })
      .select("id, pillar, is_public, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created situation ${data.id}` }],
      structuredContent: { row: data },
    };
  },
});
