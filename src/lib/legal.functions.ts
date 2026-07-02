import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEGAL_VERSION } from "@/lib/seo/legal";
import { randomAliasParts } from "@/lib/alias.functions";

const recordSchema = z.object({
  terms_version: z.string().default(LEGAL_VERSION.terms),
  privacy_version: z.string().default(LEGAL_VERSION.privacy),
});

/** Stamp legal acceptance on the user's aliases row.
 *  Ensures the row exists (creates a placeholder with a random alias if not),
 *  then updates the accepted_* columns. */
export const recordLegalAcceptance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => recordSchema.parse(data))
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
    // Ensure the alias row exists first so the UPDATE below is guaranteed
    // to hit a row. The seed is only used when no row exists yet.
    const existing = await context.supabase
      .from("aliases")
      .select("user_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!existing.data) {
      const p = randomAliasParts();
      const { error: insErr } = await context.supabase
        .from("aliases")
        .insert({
          user_id: context.userId,
          emotion: p.emotion,
          nation: p.nation,
          creature: p.creature,
          emoji: p.emoji,
          display_name: p.display_name,
          birth_year: 1990,
          birth_month: 1,
          birth_day: 1,
          accepted_terms_version: data.terms_version,
          accepted_terms_at: now,
          accepted_privacy_version: data.privacy_version,
          accepted_privacy_at: now,
        } as never);
      if (insErr) return { ok: false as const, error: insErr.message };
      return { ok: true as const };
    }
    const { error } = await context.supabase
      .from("aliases")
      .update({
        accepted_terms_version: data.terms_version,
        accepted_terms_at: now,
        accepted_privacy_version: data.privacy_version,
        accepted_privacy_at: now,
      })
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
