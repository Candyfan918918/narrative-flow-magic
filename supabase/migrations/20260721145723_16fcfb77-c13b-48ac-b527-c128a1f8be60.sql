DROP POLICY IF EXISTS "events self select" ON public.events;
CREATE POLICY "events self select" ON public.events
FOR SELECT TO authenticated
USING (
  ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
);