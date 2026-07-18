
-- 1) Revoke SELECT on situations.alias_id from anon/authenticated so public
--    reads cannot expose the pseudonymity secret. Server code that needs it
--    already uses supabaseAdmin.
REVOKE SELECT (alias_id) ON public.situations FROM anon;
REVOKE SELECT (alias_id) ON public.situations FROM authenticated;

-- 2) Tighten mirror_signals ms_self_all policy so anonymous Supabase sessions
--    (is_anonymous=true JWTs in the authenticated role) cannot access rows.
DROP POLICY IF EXISTS ms_self_all ON public.mirror_signals;
CREATE POLICY ms_self_all ON public.mirror_signals
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  )
  WITH CHECK (
    user_id = auth.uid()
    AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );
