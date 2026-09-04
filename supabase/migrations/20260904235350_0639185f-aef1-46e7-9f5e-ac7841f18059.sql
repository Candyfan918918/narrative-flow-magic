ALTER TABLE public.joke_flips
  ADD COLUMN IF NOT EXISTS grant_set_id uuid,
  ADD COLUMN IF NOT EXISTS grant_position integer,
  ADD COLUMN IF NOT EXISTS grant_consumed boolean NOT NULL DEFAULT true;