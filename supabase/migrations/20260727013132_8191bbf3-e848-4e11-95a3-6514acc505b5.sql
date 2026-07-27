DROP POLICY IF EXISTS "self reads own events" ON public.behavioral_events;
CREATE POLICY "self reads own events" ON public.behavioral_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);