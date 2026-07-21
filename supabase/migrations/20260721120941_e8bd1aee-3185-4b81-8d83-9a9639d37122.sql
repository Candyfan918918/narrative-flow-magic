
-- Fix mirror_onboarding UPDATE WITH CHECK to match USING (exclude anonymous)
DROP POLICY IF EXISTS "owners update own onboarding" ON public.mirror_onboarding;
CREATE POLICY "owners update own onboarding" ON public.mirror_onboarding
  FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) AND (COALESCE(((auth.jwt() ->> 'is_anonymous'::text))::boolean, false) = false))
  WITH CHECK ((auth.uid() = user_id) AND (COALESCE(((auth.jwt() ->> 'is_anonymous'::text))::boolean, false) = false));

-- Harden admin-read policy on feedback_events to exclude anonymous sessions
DROP POLICY IF EXISTS "admins read feedback events" ON public.feedback_events;
CREATE POLICY "admins read feedback events" ON public.feedback_events
  FOR SELECT TO authenticated
  USING (
    COALESCE(((auth.jwt() ->> 'is_anonymous'::text))::boolean, false) = false
    AND has_role(auth.uid(), 'admin'::app_role)
  );
