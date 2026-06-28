
-- PART 1: extend situations (idempotent)
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS kind text;
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS edited boolean NOT NULL DEFAULT false;
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS read text;
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS factors text[];
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS initial_scan int;
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS support_mode text;

-- PART 2: mirror_shape table
CREATE TABLE IF NOT EXISTS public.mirror_shape (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shape text,
  line text,
  movement text,
  at timestamptz DEFAULT now(),
  history jsonb NOT NULL DEFAULT '[]'::jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mirror_shape TO authenticated;
GRANT ALL ON public.mirror_shape TO service_role;

ALTER TABLE public.mirror_shape ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mirror_shape' AND policyname='mirror_shape_select_own') THEN
    CREATE POLICY mirror_shape_select_own ON public.mirror_shape FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mirror_shape' AND policyname='mirror_shape_insert_own') THEN
    CREATE POLICY mirror_shape_insert_own ON public.mirror_shape FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mirror_shape' AND policyname='mirror_shape_update_own') THEN
    CREATE POLICY mirror_shape_update_own ON public.mirror_shape FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='mirror_shape' AND policyname='mirror_shape_delete_own') THEN
    CREATE POLICY mirror_shape_delete_own ON public.mirror_shape FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;
