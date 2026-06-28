-- Extend situations with the few columns not already present
ALTER TABLE public.situations
  ADD COLUMN IF NOT EXISTS arc jsonb,
  ADD COLUMN IF NOT EXISTS emotional_core text,
  ADD COLUMN IF NOT EXISTS the_real_thing text,
  ADD COLUMN IF NOT EXISTS support_mode text;

CREATE INDEX IF NOT EXISTS situations_alias_kind_idx
  ON public.situations(alias_id, kind) WHERE deleted_at IS NULL;

-- ============ comment_records ============
CREATE TABLE IF NOT EXISTS public.comment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  situation_id uuid NOT NULL REFERENCES public.situations(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  clean_text text NOT NULL,
  edited boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comment_records TO authenticated;
GRANT ALL ON public.comment_records TO service_role;
ALTER TABLE public.comment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read non-deleted comments" ON public.comment_records
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "author manages own comments" ON public.comment_records
  FOR ALL TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE TRIGGER comment_records_touch BEFORE UPDATE ON public.comment_records
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS comment_records_situation_idx ON public.comment_records(situation_id, created_at);

-- ============ mirror_shape ============
CREATE TABLE IF NOT EXISTS public.mirror_shape (
  user_id uuid PRIMARY KEY,
  shape text NOT NULL,
  line text NOT NULL DEFAULT '',
  movement text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mirror_shape TO authenticated;
GRANT ALL ON public.mirror_shape TO service_role;
ALTER TABLE public.mirror_shape ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self manages own shape" ON public.mirror_shape
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER mirror_shape_touch BEFORE UPDATE ON public.mirror_shape
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ behavioral_events ============
CREATE TABLE IF NOT EXISTS public.behavioral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.behavioral_events TO authenticated;
GRANT ALL ON public.behavioral_events TO service_role;
ALTER TABLE public.behavioral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self reads own events" ON public.behavioral_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "self writes own events" ON public.behavioral_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS behavioral_events_user_time_idx ON public.behavioral_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS behavioral_events_user_kind_idx ON public.behavioral_events(user_id, kind);

-- ============ mirror_sessions ============
CREATE TABLE IF NOT EXISTS public.mirror_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  turns jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mirror_sessions TO authenticated;
GRANT ALL ON public.mirror_sessions TO service_role;
ALTER TABLE public.mirror_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "self manages own sessions" ON public.mirror_sessions
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER mirror_sessions_touch BEFORE UPDATE ON public.mirror_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
