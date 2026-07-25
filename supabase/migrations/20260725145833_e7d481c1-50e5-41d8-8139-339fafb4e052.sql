DROP POLICY IF EXISTS "owner reads own responses" ON public.checkin_responses;

CREATE POLICY "owner reads own responses"
ON public.checkin_responses
FOR SELECT
TO authenticated
USING (
  alias_id = auth.uid()
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);