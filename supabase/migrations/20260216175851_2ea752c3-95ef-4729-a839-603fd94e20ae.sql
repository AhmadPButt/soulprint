
-- Create destination matches table
CREATE TABLE public.destination_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID REFERENCES public.respondents(id) NOT NULL,
  destination_id UUID REFERENCES public.echoprint_destinations(id) NOT NULL,
  context_intake_id UUID REFERENCES public.context_intake(id),
  
  -- Match results
  fit_score FLOAT NOT NULL,
  fit_breakdown JSONB NOT NULL,
  rank INT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  shown_to_user BOOLEAN DEFAULT false,
  clicked_by_user BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_matches_respondent ON public.destination_matches(respondent_id);
CREATE INDEX idx_matches_destination ON public.destination_matches(destination_id);
CREATE UNIQUE INDEX idx_matches_respondent_destination ON public.destination_matches(respondent_id, destination_id);

-- RLS
ALTER TABLE public.destination_matches ENABLE ROW LEVEL SECURITY;

-- Users can view their own matches
CREATE POLICY "Users can view their own matches"
ON public.destination_matches FOR SELECT
USING (respondent_id IN (
  SELECT id FROM public.respondents WHERE user_id = auth.uid()
));

-- Users can update their own matches (for clicked_by_user tracking)
CREATE POLICY "Users can update their own matches"
ON public.destination_matches FOR UPDATE
USING (respondent_id IN (
  SELECT id FROM public.respondents WHERE user_id = auth.uid()
));

-- Admin/service can insert matches
CREATE POLICY "Service can insert matches"
ON public.destination_matches FOR INSERT
WITH CHECK (true);

-- Admin can view all matches
CREATE POLICY "Admin can view all matches"
ON public.destination_matches FOR SELECT
USING (true);

-- Admin can delete matches
CREATE POLICY "Admin can delete matches"
ON public.destination_matches FOR DELETE
USING (true);
