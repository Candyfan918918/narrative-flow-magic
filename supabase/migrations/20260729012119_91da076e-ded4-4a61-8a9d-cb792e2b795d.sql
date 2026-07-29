DROP POLICY IF EXISTS "users update own alias" ON public.aliases;
DROP POLICY IF EXISTS "users delete own alias" ON public.aliases;

CREATE POLICY "users update own alias" ON public.aliases
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

CREATE POLICY "users delete own alias" ON public.aliases
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);