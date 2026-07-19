
-- Restrict SELECT on situations.alias_id: revoke table-wide SELECT and re-grant explicit column list excluding alias_id
REVOKE SELECT ON public.situations FROM anon, authenticated;

GRANT SELECT (id, pillar, clean_text, initial_scan, scan_band, reflection, crisis_flag, status, tags, is_public, room_id, created_at, updated_at, resolved_at, kind, title, body, edited, deleted_at, scan_signature, scan_read, scan_factors, embedding, is_seed, human_response_at, arc, emotional_core, the_real_thing, support_mode, signature, read, factors, scan_reasoning, scan_basis, scan_corpus_n, scan_cultural_note, slug)
ON public.situations TO anon, authenticated;

-- Harden mirror_sessions: exclude anonymous JWTs
DROP POLICY IF EXISTS "self manages own sessions" ON public.mirror_sessions;

CREATE POLICY "self selects own sessions" ON public.mirror_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

CREATE POLICY "self inserts own sessions" ON public.mirror_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

CREATE POLICY "self updates own sessions" ON public.mirror_sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false)
  WITH CHECK (user_id = auth.uid() AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false);

CREATE POLICY "self deletes own sessions" ON public.mirror_sessions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false);
