
DROP POLICY IF EXISTS "rooms readable by signed-in" ON public.rooms;
CREATE POLICY "rooms readable by anyone" ON public.rooms FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.rooms TO anon;

DROP POLICY IF EXISTS "relates read all" ON public.room_relates;
CREATE POLICY "relates read all" ON public.room_relates FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.room_relates TO anon;
