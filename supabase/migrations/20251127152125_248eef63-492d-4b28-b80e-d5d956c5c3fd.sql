-- Create trip_reflections table for post-trip reviews and NPS ratings
CREATE TABLE public.trip_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID NOT NULL REFERENCES public.respondents(id) ON DELETE CASCADE,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  review_text TEXT,
  trip_summary TEXT,
  highlights JSONB,
  photo_urls JSONB,
  would_recommend BOOLEAN,
  favorite_moments TEXT[],
  challenges_faced TEXT[],
  personal_growth TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_reflections ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own reflections
CREATE POLICY "Users can view their own reflections"
ON public.trip_reflections
FOR SELECT
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own reflections"
ON public.trip_reflections
FOR INSERT
TO authenticated
WITH CHECK (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own reflections"
ON public.trip_reflections
FOR UPDATE
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);

-- Admins can view all reflections
CREATE POLICY "Authenticated users can view all reflections"
ON public.trip_reflections
FOR SELECT
TO authenticated
USING (true);

-- Create index
CREATE INDEX idx_trip_reflections_respondent_id ON public.trip_reflections(respondent_id);

-- Create mood_insights table for AI-generated insights
CREATE TABLE public.mood_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID NOT NULL REFERENCES public.respondents(id) ON DELETE CASCADE,
  insights_text TEXT NOT NULL,
  recommendations TEXT,
  emotional_patterns JSONB,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  model_used TEXT
);

-- Enable RLS
ALTER TABLE public.mood_insights ENABLE ROW LEVEL SECURITY;

-- Users can view their own insights
CREATE POLICY "Users can view their own insights"
ON public.mood_insights
FOR SELECT
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);

-- Admins can view all insights
CREATE POLICY "Authenticated users can view all insights"
ON public.mood_insights
FOR SELECT
TO authenticated
USING (true);

-- Create index
CREATE INDEX idx_mood_insights_respondent_id ON public.mood_insights(respondent_id);