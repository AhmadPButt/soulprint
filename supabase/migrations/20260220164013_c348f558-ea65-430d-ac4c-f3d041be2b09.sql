
-- Add trip_id to itineraries so each trip has its own distinct itinerary
-- Drop the old unique constraint on respondent_id (one itinerary per respondent)
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE;

-- Create index for fast lookups by trip_id
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);

-- Add RLS policy for trip-scoped itinerary access
CREATE POLICY "Users can view itineraries for their trips"
  ON public.itineraries
  FOR SELECT
  USING (
    trip_id IS NOT NULL AND user_is_trip_creator(auth.uid(), trip_id)
  );

CREATE POLICY "Users can insert itineraries for their trips"
  ON public.itineraries
  FOR INSERT
  WITH CHECK (
    trip_id IS NULL OR user_is_trip_creator(auth.uid(), trip_id)
  );

CREATE POLICY "Users can update itineraries for their trips"
  ON public.itineraries
  FOR UPDATE
  USING (
    trip_id IS NULL OR user_is_trip_creator(auth.uid(), trip_id)
  );
