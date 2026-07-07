import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runScrub } from "@/lib/agents/scrubber.functions";
import { runClassifyCrisis } from "@/lib/agents/guard.functions";

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
    const userId = ctx.getUserId();
    const { data: alias, error: aliasErr } = await supabase
      .from("aliases")
      .select("user_id")
      .eq("user_id", userId)
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
    // Mirror runSpill: scrub PII first, then crisis-classify. Fail safe — if
    // scrubbing throws, keep the raw text but force private; if crisis, force
    // private + crisis_flag regardless of the caller's is_public argument.
    let textToInsert = clean_text;
    let forcePrivate = false;
    let crisisFlag = false;
    try {
      const scrub = await runScrub(clean_text);
      textToInsert = scrub.clean_text && scrub.clean_text.length > 0 ? scrub.clean_text : clean_text;
      try {
        const guard = await runClassifyCrisis(textToInsert);
        if (guard.crisis) {
          crisisFlag = true;
          forcePrivate = true;
        }
      } catch {
        // guard failure is non-fatal; proceed with scrubbed text and caller's is_public
      }
    } catch {
      forcePrivate = true;
    }

    const { data, error } = await supabase
      .from("situations")
      .insert({
        alias_id: userId,
        clean_text: textToInsert,
        pillar,
        is_public: forcePrivate ? false : (is_public ?? false),
        crisis_flag: crisisFlag,
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
