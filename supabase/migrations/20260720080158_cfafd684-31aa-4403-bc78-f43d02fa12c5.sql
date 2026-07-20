
DROP POLICY IF EXISTS mp_self_select ON public.mirror_patterns;
DROP POLICY IF EXISTS mp_self_update ON public.mirror_patterns;
DROP POLICY IF EXISTS mp_self_delete ON public.mirror_patterns;

CREATE POLICY mp_self_select ON public.mirror_patterns
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

CREATE POLICY mp_self_update ON public.mirror_patterns
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK (user_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

CREATE POLICY mp_self_delete ON public.mirror_patterns
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
