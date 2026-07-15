ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS is_companion boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS companion_seen_at timestamptz;

CREATE INDEX IF NOT EXISTS comments_room_companion_created_idx
  ON public.comments (room_id, created_at DESC)
  WHERE is_companion = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS situations_cold_queue_idx
  ON public.situations (created_at ASC)
  WHERE is_public = true AND is_seed = false AND crisis_flag = false AND deleted_at IS NULL;