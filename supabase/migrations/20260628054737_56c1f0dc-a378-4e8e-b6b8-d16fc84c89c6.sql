
ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

-- Helpful index for the scheduler's main query
CREATE INDEX IF NOT EXISTS checkins_due_idx
  ON public.checkins (scheduled_at)
  WHERE state = 'scheduled';
