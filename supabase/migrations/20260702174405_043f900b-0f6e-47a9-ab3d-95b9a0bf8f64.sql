
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  first_name text,
  last_name text,
  full_name text,
  avatar_url text,
  provider text,
  is_anonymous boolean NOT NULL DEFAULT true,
  first_visit_at timestamptz NOT NULL DEFAULT now(),
  last_visit_at timestamptz NOT NULL DEFAULT now(),
  visit_count integer NOT NULL DEFAULT 0,
  last_country text,
  last_city text,
  last_user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  path text,
  referrer text,
  user_agent text,
  country text,
  city text,
  is_revisit boolean NOT NULL DEFAULT false
);
CREATE INDEX visits_user_id_idx ON public.visits (user_id, started_at DESC);
CREATE INDEX visits_session_idx ON public.visits (session_id);
GRANT SELECT ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits self select" ON public.visits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  ts timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX events_user_id_ts_idx ON public.events (user_id, ts DESC);
CREATE INDEX events_name_ts_idx ON public.events (name, ts DESC);
GRANT SELECT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events self select" ON public.events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_user_stats(_user_id uuid)
RETURNS TABLE (spills bigint, comments bigint, reactions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.situations WHERE alias_id = _user_id),
    (SELECT count(*) FROM public.comment_records WHERE author_id = _user_id),
    (SELECT count(*) FROM public.room_reactions WHERE user_id = _user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.get_user_stats(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO service_role;
