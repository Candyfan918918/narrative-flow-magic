
-- 1. Fix search_path on mirror_depth_for
CREATE OR REPLACE FUNCTION public.mirror_depth_for(_count integer)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _count < 10  THEN 1
    WHEN _count < 25  THEN 2
    WHEN _count < 60  THEN 3
    WHEN _count < 120 THEN 4
    ELSE 5
  END
$$;

-- 2. Revoke EXECUTE from anon/authenticated/public on SECURITY DEFINER helpers
--    that are only meant to be called server-side (service_role).
REVOKE EXECUTE ON FUNCTION public.derive_outcome_from_response() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_mirror_evolution(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_pending_checkins(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_mirror(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_user_patterns(uuid, vector, integer, double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_situations(vector, text, integer, double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.alias_public(uuid) FROM PUBLIC, anon, authenticated;

-- Keep has_role executable — it is referenced inside RLS policies and must be
-- callable in the authenticated role's planner context.

-- 3. user_roles: exclude anonymous sign-in JWTs
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;

CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "users see own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  );

-- 4. comment_records: restrict SELECT to author only
DROP POLICY IF EXISTS "read non-deleted comments" ON public.comment_records;
-- "author manages own comments" (FOR ALL) already covers the author's own reads.

-- 5. room_relates: restrict SELECT to authenticated (drop anon read)
DROP POLICY IF EXISTS "relates read all" ON public.room_relates;
CREATE POLICY "relates read authenticated" ON public.room_relates
  FOR SELECT TO authenticated USING (true);

-- 6. situations.alias_id: hide from anon (column-level)
REVOKE SELECT (alias_id) ON public.situations FROM anon;

-- 7. mirror_patterns: ensure public demo rows can't leak user data.
--    Restrict mp_demo_read_all to rows with no user linkage.
DROP POLICY IF EXISTS "mp_demo_read_all" ON public.mirror_patterns;
CREATE POLICY "mp_demo_read_all" ON public.mirror_patterns
  FOR SELECT TO anon, authenticated
  USING (is_demo = true AND user_id IS NULL);

-- Enforce at the data layer that demo rows never carry a user_id via a trigger
-- (CHECK constraints can't reliably guard cross-column immutable invariants,
-- but this is a simple constant relationship so a CHECK is fine).
ALTER TABLE public.mirror_patterns
  DROP CONSTRAINT IF EXISTS mirror_patterns_demo_no_user;
ALTER TABLE public.mirror_patterns
  ADD CONSTRAINT mirror_patterns_demo_no_user
  CHECK (is_demo = false OR user_id IS NULL) NOT VALID;
