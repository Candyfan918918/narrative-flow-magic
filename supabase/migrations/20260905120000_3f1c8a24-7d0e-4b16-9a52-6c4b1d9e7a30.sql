-- The card writers upsert on (set_id, position): dealing the three cards, and
-- rerolling one of them, both address a card by its slot in the set. Without a
-- unique constraint there ON CONFLICT has nothing to match and the write fails,
-- so a retried deal would also be free to insert a fourth card into a set.
--
-- The constraint already exists on the project database, where it was added
-- out of band rather than through a migration. This file is what a database
-- built from this repo's migrations gets, so it is written to be a no-op
-- wherever the constraint is already in place.

-- Collapse any duplicates a pre-constraint write may have left behind, keeping
-- the newest card in each slot. A no-op once the constraint is present.
DELETE FROM public.joke_cards a
USING public.joke_cards b
WHERE a.set_id = b.set_id
  AND a.position = b.position
  AND (a.created_at, a.id) < (b.created_at, b.id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.joke_cards'::regclass
      AND conname = 'joke_cards_set_position_key'
  ) THEN
    ALTER TABLE public.joke_cards
      ADD CONSTRAINT joke_cards_set_position_key UNIQUE (set_id, "position");
  END IF;
END $$;
