DROP POLICY IF EXISTS "Anyone can view pillar status" ON public.pillar_status;
DROP POLICY IF EXISTS "pillar_status readable by everyone" ON public.pillar_status;
DROP POLICY IF EXISTS "pillar_status admin write" ON public.pillar_status;

CREATE POLICY "pillar_status readable by authenticated"
  ON public.pillar_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "pillar_status admin write"
  ON public.pillar_status FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE SELECT ON public.pillar_status FROM anon;