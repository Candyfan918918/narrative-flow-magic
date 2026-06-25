
CREATE TABLE public.feedback_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  v TEXT NOT NULL CHECK (v IN ('love','friction','question','neutral')),
  t TIMESTAMPTZ NOT NULL DEFAULT now(),
  page TEXT,
  sid TEXT,
  alias TEXT,
  target TEXT,
  label TEXT,
  text TEXT,
  score NUMERIC,
  signature TEXT,
  intent TEXT,
  kind TEXT,
  sec NUMERIC,
  note TEXT,
  mode TEXT,
  trigger TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX feedback_events_type_t_idx ON public.feedback_events (type, t DESC);
CREATE INDEX feedback_events_v_t_idx ON public.feedback_events (v, t DESC);
CREATE INDEX feedback_events_t_idx ON public.feedback_events (t DESC);

GRANT INSERT ON public.feedback_events TO anon, authenticated;
GRANT SELECT ON public.feedback_events TO authenticated;
GRANT ALL ON public.feedback_events TO service_role;

ALTER TABLE public.feedback_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a pseudonymous event (no identity is stored).
CREATE POLICY "anyone can insert feedback events"
  ON public.feedback_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read raw events.
CREATE POLICY "admins read feedback events"
  ON public.feedback_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
