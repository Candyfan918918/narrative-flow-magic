DROP POLICY IF EXISTS "owner reads own checkins" ON public.checkins;
DROP POLICY IF EXISTS "owner updates own checkins" ON public.checkins;

CREATE POLICY "owner reads own checkins" ON public.checkins
FOR SELECT TO authenticated
USING (alias_id = auth.uid() AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);

CREATE POLICY "owner updates own checkins" ON public.checkins
FOR UPDATE TO authenticated
USING (alias_id = auth.uid() AND (auth.jwt() ->> 'is_anonymous')::boolean IS NOT TRUE);