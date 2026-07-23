DROP POLICY IF EXISTS "author manages own comments" ON public.comment_records;
CREATE POLICY "author manages own comments" ON public.comment_records
  FOR ALL TO authenticated
  USING (author_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  WITH CHECK (author_id = auth.uid() AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);