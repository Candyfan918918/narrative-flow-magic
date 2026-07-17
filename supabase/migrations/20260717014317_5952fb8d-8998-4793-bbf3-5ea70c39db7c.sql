
-- Harden pii_scrub_log against anonymous JWTs
DROP POLICY IF EXISTS "owner reads own scrub log" ON public.pii_scrub_log;
DROP POLICY IF EXISTS "owner writes own scrub log" ON public.pii_scrub_log;

CREATE POLICY "owner reads own scrub log" ON public.pii_scrub_log
  FOR SELECT TO authenticated
  USING (
    alias_id = auth.uid()
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

CREATE POLICY "owner writes own scrub log" ON public.pii_scrub_log
  FOR INSERT TO authenticated
  WITH CHECK (
    alias_id = auth.uid()
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- Ensure situations.alias_id is not readable by anon/authenticated
REVOKE SELECT (alias_id) ON public.situations FROM anon, authenticated, PUBLIC;
