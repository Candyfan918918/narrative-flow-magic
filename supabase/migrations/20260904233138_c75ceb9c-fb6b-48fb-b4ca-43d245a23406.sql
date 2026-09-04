-- joke_sets
CREATE TABLE public.joke_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anon_session_id text,
  clean_text text NOT NULL,
  archetype text NOT NULL DEFAULT 'general',
  angles text[] NOT NULL DEFAULT '{}',
  is_seed boolean NOT NULL DEFAULT true,
  corpus_eligible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX joke_sets_user_idx ON public.joke_sets (user_id, created_at DESC);
CREATE INDEX joke_sets_anon_idx ON public.joke_sets (anon_session_id, created_at DESC);

GRANT SELECT ON public.joke_sets TO authenticated;
GRANT ALL ON public.joke_sets TO service_role;
ALTER TABLE public.joke_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "joke_sets owner read" ON public.joke_sets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER joke_sets_touch_updated_at BEFORE UPDATE ON public.joke_sets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- joke_cards
CREATE TABLE public.joke_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id uuid NOT NULL REFERENCES public.joke_sets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  angle text NOT NULL,
  card_text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  used_fallback boolean NOT NULL DEFAULT false,
  judge_score numeric,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  is_seed boolean NOT NULL DEFAULT true,
  corpus_eligible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX joke_cards_user_idx ON public.joke_cards (user_id, created_at DESC);
CREATE INDEX joke_cards_set_idx ON public.joke_cards (set_id);

GRANT SELECT ON public.joke_cards TO authenticated;
GRANT ALL ON public.joke_cards TO service_role;
ALTER TABLE public.joke_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "joke_cards owner read" ON public.joke_cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER joke_cards_touch_updated_at BEFORE UPDATE ON public.joke_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- joke_flips: per-subject per-day counter
CREATE TABLE public.joke_flips (
  subject_key text NOT NULL,
  day date NOT NULL,
  flips_used integer NOT NULL DEFAULT 0,
  sets_flipped integer NOT NULL DEFAULT 0,
  set_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subject_key, day)
);

GRANT ALL ON public.joke_flips TO service_role;
ALTER TABLE public.joke_flips ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER joke_flips_touch_updated_at BEFORE UPDATE ON public.joke_flips
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- rooms gain a source label
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'spill';