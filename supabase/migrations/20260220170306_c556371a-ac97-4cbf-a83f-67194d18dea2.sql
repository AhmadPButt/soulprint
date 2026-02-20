-- Drop the unique constraint on respondent_id that prevents multiple trip itineraries per respondent
-- A respondent should be able to have one itinerary per trip
ALTER TABLE public.itineraries DROP CONSTRAINT IF EXISTS itineraries_respondent_id_unique;

-- Add a unique constraint on (respondent_id, trip_id) to allow one itinerary per trip per respondent
-- but only when trip_id is NOT NULL. For legacy null trip_id rows, keep existing behavior.
CREATE UNIQUE INDEX IF NOT EXISTS itineraries_trip_id_unique ON public.itineraries (trip_id) WHERE trip_id IS NOT NULL;
