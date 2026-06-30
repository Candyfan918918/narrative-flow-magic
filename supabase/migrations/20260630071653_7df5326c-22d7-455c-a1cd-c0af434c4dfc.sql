
-- ============ mirror_patterns ============
CREATE TABLE IF NOT EXISTS public.mirror_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_demo boolean NOT NULL DEFAULT false,
  name text NOT NULL DEFAULT '',
  emoji text NOT NULL DEFAULT '✦',
  district text NOT NULL DEFAULT 'self' CHECK (district IN ('self','career','love','family','social')),
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','ruin')),
  insight text NOT NULL DEFAULT '',
  punch text NOT NULL DEFAULT '',
  record text NOT NULL DEFAULT '',
  count int NOT NULL DEFAULT 0,
  depth int NOT NULL DEFAULT 1,
  trend numeric[] NOT NULL DEFAULT ARRAY[0,0,0,0,0,0,0]::numeric[],
  trend_dir text NOT NULL DEFAULT 'steady' CHECK (trend_dir IN ('rising','steady','cooling','dormant')),
  sources jsonb NOT NULL DEFAULT '{"spill":0,"scan":0,"comments":0,"likes":0,"follows":0,"browse":0}'::jsonb,
  embedding vector(1536),
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  position jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mirror_patterns_demo_owner_chk CHECK (
    (is_demo = true AND user_id IS NULL) OR (is_demo = false AND user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS mirror_patterns_user_idx ON public.mirror_patterns (user_id, last_seen DESC) WHERE is_demo = false;
CREATE INDEX IF NOT EXISTS mirror_patterns_demo_idx ON public.mirror_patterns (is_demo) WHERE is_demo = true;
CREATE INDEX IF NOT EXISTS mirror_patterns_embedding_idx ON public.mirror_patterns USING hnsw (embedding vector_cosine_ops);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mirror_patterns TO authenticated;
GRANT SELECT ON public.mirror_patterns TO anon;
GRANT ALL ON public.mirror_patterns TO service_role;

ALTER TABLE public.mirror_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_demo_read_all" ON public.mirror_patterns
  FOR SELECT TO anon, authenticated
  USING (is_demo = true);

CREATE POLICY "mp_self_select" ON public.mirror_patterns
  FOR SELECT TO authenticated
  USING (is_demo = false AND user_id = auth.uid());

CREATE POLICY "mp_self_insert" ON public.mirror_patterns
  FOR INSERT TO authenticated
  WITH CHECK (is_demo = false AND user_id = auth.uid());

CREATE POLICY "mp_self_update" ON public.mirror_patterns
  FOR UPDATE TO authenticated
  USING (is_demo = false AND user_id = auth.uid())
  WITH CHECK (is_demo = false AND user_id = auth.uid());

CREATE POLICY "mp_self_delete" ON public.mirror_patterns
  FOR DELETE TO authenticated
  USING (is_demo = false AND user_id = auth.uid());

CREATE TRIGGER mp_touch_updated BEFORE UPDATE ON public.mirror_patterns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ mirror_signals ============
CREATE TABLE IF NOT EXISTS public.mirror_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id uuid REFERENCES public.mirror_patterns(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('spill','scan','comments','likes','follows','browse')),
  ref_id text NOT NULL,
  text_scrubbed text NOT NULL DEFAULT '',
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, ref_id)
);

CREATE INDEX IF NOT EXISTS mirror_signals_user_idx ON public.mirror_signals (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mirror_signals_pattern_idx ON public.mirror_signals (pattern_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mirror_signals TO authenticated;
GRANT ALL ON public.mirror_signals TO service_role;

ALTER TABLE public.mirror_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ms_self_all" ON public.mirror_signals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.mirror_depth_for(_count int)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _count < 10  THEN 1
    WHEN _count < 25  THEN 2
    WHEN _count < 60  THEN 3
    WHEN _count < 120 THEN 4
    ELSE 5
  END
$$;

CREATE OR REPLACE FUNCTION public.match_user_patterns(
  p_user uuid,
  q vector(1536),
  match_count int DEFAULT 1,
  similarity_floor float DEFAULT 0.78
)
RETURNS TABLE (id uuid, name text, district text, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mp.id, mp.name, mp.district, 1 - (mp.embedding <=> q) AS similarity
  FROM public.mirror_patterns mp
  WHERE mp.user_id = p_user
    AND mp.is_demo = false
    AND mp.embedding IS NOT NULL
    AND 1 - (mp.embedding <=> q) >= similarity_floor
  ORDER BY mp.embedding <=> q
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.recompute_mirror_evolution(_decay_days int DEFAULT 30)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.mirror_patterns
     SET depth = public.mirror_depth_for(count),
         trend_dir = CASE
           WHEN last_seen < now() - (_decay_days || ' days')::interval THEN 'dormant'
           WHEN COALESCE(trend[7],0) > COALESCE(trend[6],0) AND COALESCE(trend[6],0) >= COALESCE(trend[5],0) THEN 'rising'
           WHEN COALESCE(trend[7],0) < COALESCE(trend[6],0) THEN 'cooling'
           ELSE 'steady'
         END,
         state = CASE
           WHEN last_seen < now() - (_decay_days || ' days')::interval THEN 'ruin'
           ELSE state
         END
   WHERE is_demo = false;
END;
$$;
