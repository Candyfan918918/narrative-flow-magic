
REVOKE EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.schedule_checkins(uuid, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.derive_outcome_from_response() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.derive_outcome_from_response() TO service_role;
