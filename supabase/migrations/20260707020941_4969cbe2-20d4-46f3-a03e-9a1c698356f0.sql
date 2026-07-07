
-- Restrict situations policies to exclude anonymously signed-in users
DROP POLICY IF EXISTS "authenticated reads public non-crisis non-deleted" ON public.situations;
DROP POLICY IF EXISTS "owner reads own situation" ON public.situations;
DROP POLICY IF EXISTS "owner updates own situation" ON public.situations;
DROP POLICY IF EXISTS "owner deletes own situation" ON public.situations;
DROP POLICY IF EXISTS "owner inserts own situation" ON public.situations;

CREATE POLICY "authenticated reads public non-crisis non-deleted"
ON public.situations FOR SELECT TO authenticated
USING (
  is_public = true AND crisis_flag = false AND status::text <> 'deleted'
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

CREATE POLICY "owner reads own situation"
ON public.situations FOR SELECT TO authenticated
USING (
  alias_id = auth.uid()
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

CREATE POLICY "owner inserts own situation"
ON public.situations FOR INSERT TO authenticated
WITH CHECK (
  alias_id = auth.uid()
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

CREATE POLICY "owner updates own situation"
ON public.situations FOR UPDATE TO authenticated
USING (
  alias_id = auth.uid()
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
)
WITH CHECK (
  alias_id = auth.uid()
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);

CREATE POLICY "owner deletes own situation"
ON public.situations FOR DELETE TO authenticated
USING (
  alias_id = auth.uid()
  AND COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
);
