ALTER TABLE public.situations
  ADD COLUMN IF NOT EXISTS scan_reasoning jsonb,
  ADD COLUMN IF NOT EXISTS scan_basis text DEFAULT 'model_prior',
  ADD COLUMN IF NOT EXISTS scan_corpus_n integer,
  ADD COLUMN IF NOT EXISTS scan_cultural_note text;