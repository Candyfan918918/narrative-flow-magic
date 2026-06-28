-- 1) Tighten feedback_events INSERT policy: no more WITH CHECK (true)
DROP POLICY IF EXISTS "anyone can insert feedback events" ON public.feedback_events;
CREATE POLICY "anyone can insert feedback events"
ON public.feedback_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  type IS NOT NULL
  AND length(type) BETWEEN 1 AND 64
  AND v IS NOT NULL
  AND length(v) BETWEEN 1 AND 64
);

-- 2) Revoke EXECUTE from PUBLIC / authenticated on internal SECURITY DEFINER helpers.
--    These are used by RLS policies, triggers, or admin server code (service_role).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_pending_checkins(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.derive_outcome_from_response() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.match_situations(vector, text, integer, double precision) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_mirror(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.alias_public(uuid) FROM PUBLIC, anon;

-- Keep alias_public callable by signed-in users (community surfaces use it to fetch display_name/emoji).
GRANT EXECUTE ON FUNCTION public.alias_public(uuid) TO authenticated;

-- Service role retains full access via default GRANTs.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_pending_checkins(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_situations(vector, text, integer, double precision) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_mirror(uuid, text) TO service_role;