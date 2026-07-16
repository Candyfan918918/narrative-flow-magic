
-- 1. Revoke SELECT on situations.alias_id from anon/authenticated (keep row-level policies)
REVOKE SELECT (alias_id) ON public.situations FROM anon, authenticated;

-- 2. Recreate visits_classified view with security_invoker
ALTER VIEW public.visits_classified SET (security_invoker = true);

-- 3. Tighten pillar_status policies to exclude anonymous-authenticated sessions
DROP POLICY IF EXISTS "pillar_status admin write" ON public.pillar_status;
DROP POLICY IF EXISTS "pillar_status readable by admin" ON public.pillar_status;

CREATE POLICY "pillar_status admin read"
  ON public.pillar_status
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "pillar_status admin write"
  ON public.pillar_status
  FOR ALL
  TO authenticated
  USING (
    COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );
