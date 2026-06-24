
-- ROOMS
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  emoji TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  support TEXT NOT NULL CHECK (support IN ('heard','advice')),
  hall TEXT NOT NULL CHECK (hall IN ('healing','brave','relatable','loving')),
  reflection TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms readable by signed-in" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "rooms insert own" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "rooms update own" ON public.rooms FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "rooms delete own" ON public.rooms FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_rooms_created_at ON public.rooms (created_at DESC);
CREATE INDEX idx_rooms_hall ON public.rooms (hall);

-- REACTIONS (one row per user per kind per room)
CREATE TABLE public.room_reactions (
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('heard','same','strong','time','brave')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id, kind)
);
GRANT SELECT, INSERT, DELETE ON public.room_reactions TO authenticated;
GRANT ALL ON public.room_reactions TO service_role;
ALTER TABLE public.room_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions read own" ON public.room_reactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reactions insert own" ON public.room_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions delete own" ON public.room_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_reactions_room ON public.room_reactions (room_id);

-- RELATES (omg same)
CREATE TABLE public.room_relates (
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.room_relates TO authenticated;
GRANT ALL ON public.room_relates TO service_role;
ALTER TABLE public.room_relates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "relates read all" ON public.room_relates FOR SELECT TO authenticated USING (true);
CREATE POLICY "relates insert own" ON public.room_relates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "relates delete own" ON public.room_relates FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_relates_room ON public.room_relates (room_id);
