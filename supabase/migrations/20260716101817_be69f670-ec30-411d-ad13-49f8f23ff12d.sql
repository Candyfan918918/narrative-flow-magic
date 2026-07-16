
-- Restrict pillar_status to admin-only reads (removes broad authenticated read).
DROP POLICY IF EXISTS "pillar_status readable by authenticated" ON public.pillar_status;
CREATE POLICY "pillar_status readable by admin"
  ON public.pillar_status FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Revoke column-level SELECT on situations.alias_id from anon/authenticated so
-- public listings cannot leak the raw auth user id. Server code uses the
-- service role to resolve aliases.
REVOKE SELECT (alias_id) ON public.situations FROM anon;
REVOKE SELECT (alias_id) ON public.situations FROM authenticated;
