
-- 1) Restrict room_relates SELECT to own rows
DROP POLICY IF EXISTS "relates read authenticated" ON public.room_relates;
CREATE POLICY "relates read own" ON public.room_relates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2) Block anonymous (is_anonymous=true) sessions on visits
DROP POLICY IF EXISTS "visits self select" ON public.visits;
CREATE POLICY "visits self select" ON public.visits
  FOR SELECT TO authenticated
  USING (
    ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
    AND ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
  );

-- 3) Also harden aliases owner read against anonymous sessions
DROP POLICY IF EXISTS "owner reads own alias" ON public.aliases;
CREATE POLICY "owner reads own alias" ON public.aliases
  FOR SELECT TO authenticated
  USING (
    ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
    AND (auth.uid() = user_id)
  );

-- 4) Revoke EXECUTE on SECURITY DEFINER internal helpers from client roles.
--    These are called from triggers or server-side service-role code only.
REVOKE EXECUTE ON FUNCTION public.cancel_pending_checkins(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.derive_outcome_from_response() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_mirror_evolution(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.alias_public(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_stats(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_situations(vector, text, integer, double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_user_patterns(uuid, vector, integer, double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_mirror(uuid, text) FROM PUBLIC, anon, authenticated;
