-- Fix the trigger function to use correct column name
DROP TRIGGER IF EXISTS update_itineraries_updated_at ON public.itineraries;

-- Create corrected trigger function
CREATE OR REPLACE FUNCTION public.update_itineraries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with correct function
CREATE TRIGGER update_itineraries_updated_at
BEFORE UPDATE ON public.itineraries
FOR EACH ROW
EXECUTE FUNCTION public.update_itineraries_updated_at();