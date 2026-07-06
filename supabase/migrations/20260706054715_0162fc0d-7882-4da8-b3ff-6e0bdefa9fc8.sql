-- Block anonymous (Supabase anonymous sign-in) users from reading user_patterns rows,
-- and drop the redundant/broader owner-read policy on situations so only the
-- strict owner-only SELECT policy remains alongside the public-read policies.

DROP POLICY IF EXISTS "owner reads own patterns" ON public.user_patterns;
CREATE POLICY "owner reads own patterns"
  ON public.user_patterns
  FOR SELECT
  TO authenticated
  USING (
    ((auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
    AND alias_id = auth.uid()
  );

DROP POLICY IF EXISTS "owner reads own situations" ON public.situations;
