-- Restrict anonymous JWT sessions from reading outcomes
DROP POLICY IF EXISTS "owner reads own outcomes" ON public.outcomes;
CREATE POLICY "owner reads own outcomes" ON public.outcomes
  FOR SELECT TO authenticated
  USING (
    alias_id = auth.uid()
    AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- Hide situations.alias_id from anon/authenticated column reads
REVOKE SELECT (alias_id) ON public.situations FROM anon, authenticated;