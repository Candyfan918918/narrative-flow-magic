
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS landing_path text;

CREATE INDEX IF NOT EXISTS visits_utm_source_idx ON public.visits (utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS visits_referrer_idx ON public.visits (referrer) WHERE referrer IS NOT NULL;
CREATE INDEX IF NOT EXISTS visits_landing_path_idx ON public.visits (landing_path) WHERE landing_path IS NOT NULL;
