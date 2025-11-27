-- Create itineraries table to store generated itineraries
CREATE TABLE public.itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  respondent_id UUID NOT NULL REFERENCES public.respondents(id) ON DELETE CASCADE,
  itinerary_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Admin can view all itineraries
CREATE POLICY "Admin can view all itineraries" 
ON public.itineraries 
FOR SELECT 
USING (true);

-- Admin can insert itineraries
CREATE POLICY "Admin can insert itineraries" 
ON public.itineraries 
FOR INSERT 
WITH CHECK (true);

-- Admin can update itineraries
CREATE POLICY "Admin can update itineraries" 
ON public.itineraries 
FOR UPDATE 
USING (true);

-- Admin can delete itineraries
CREATE POLICY "Admin can delete itineraries" 
ON public.itineraries 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_itineraries_respondent_id ON public.itineraries(respondent_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_itineraries_updated_at
BEFORE UPDATE ON public.itineraries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();