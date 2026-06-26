import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LEGAL_VERSION } from "@/lib/seo/legal";

const recordSchema = z.object({
  terms_version: z.string().default(LEGAL_VERSION.terms),
  privacy_version: z.string().default(LEGAL_VERSION.privacy),
});

/** Stamp the current user's alias row with accepted_*_version + accepted_*_at.
 *  Safe to call repeatedly; only updates when version changes or null. */
export const recordLegalAcceptance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => recordSchema.parse(data))
  .handler(async ({ context, data }) => {
    const now = new Date().toISOString();
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
