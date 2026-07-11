REVOKE SELECT (alias_id) ON public.situations FROM anon, authenticated;

DROP POLICY IF EXISTS "profiles self select" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;

CREATE POLICY "profiles self select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
    AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND COALESCE(((auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );