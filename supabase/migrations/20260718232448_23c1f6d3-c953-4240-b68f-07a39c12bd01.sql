
-- 1) Revoke column-level SELECT on situations.alias_id from public browsers
REVOKE SELECT (alias_id) ON public.situations FROM anon, authenticated;

-- 2) Harden mirror_shape policies against anonymous (guest) sessions
DROP POLICY IF EXISTS mirror_shape_select_own ON public.mirror_shape;
DROP POLICY IF EXISTS mirror_shape_update_own ON public.mirror_shape;
DROP POLICY IF EXISTS mirror_shape_delete_own ON public.mirror_shape;
DROP POLICY IF EXISTS mirror_shape_insert_own ON public.mirror_shape;
DROP POLICY IF EXISTS "self manages own shape" ON public.mirror_shape;

CREATE POLICY mirror_shape_select_own ON public.mirror_shape
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

CREATE POLICY mirror_shape_insert_own ON public.mirror_shape
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

CREATE POLICY mirror_shape_update_own ON public.mirror_shape
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

CREATE POLICY mirror_shape_delete_own ON public.mirror_shape
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
