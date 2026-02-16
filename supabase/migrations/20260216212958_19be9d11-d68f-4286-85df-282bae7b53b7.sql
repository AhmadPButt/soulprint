
-- Add prediction accuracy columns to destination_matches
ALTER TABLE public.destination_matches
  ADD COLUMN IF NOT EXISTS actual_satisfaction double precision,
  ADD COLUMN IF NOT EXISTS prediction_accuracy double precision;

-- Add trip_id to trip_reflections for linking
ALTER TABLE public.trip_reflections
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id);

CREATE INDEX IF NOT EXISTS idx_trip_reflections_trip ON public.trip_reflections(trip_id);
