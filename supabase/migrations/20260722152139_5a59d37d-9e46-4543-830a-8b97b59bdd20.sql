
DROP POLICY IF EXISTS "owner updates own comment" ON public.comments;
DROP POLICY IF EXISTS "owner deletes own comment" ON public.comments;

CREATE POLICY "owner updates own comment" ON public.comments
  FOR UPDATE TO authenticated
  USING (alias_id = auth.uid() AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE)
  WITH CHECK (alias_id = auth.uid() AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "owner deletes own comment" ON public.comments
  FOR DELETE TO authenticated
  USING (alias_id = auth.uid() AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);
