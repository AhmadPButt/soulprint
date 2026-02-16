
-- Create context_intake table for geographic & trip context
CREATE TABLE public.context_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  respondent_id UUID REFERENCES public.respondents(id),
  
  geographic_constraint VARCHAR(50),
  geographic_value TEXT,
  
  occasion VARCHAR(50),
  party_composition JSONB,
  desired_outcome VARCHAR(50),
  
  timeline VARCHAR(50),
  travel_dates JSONB,
  duration VARCHAR(50),
  budget_range VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_context_intake_user ON public.context_intake(user_id);
CREATE INDEX idx_context_intake_respondent ON public.context_intake(respondent_id);

-- Enable RLS
ALTER TABLE public.context_intake ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own intake"
  ON public.context_intake FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intake"
  ON public.context_intake FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intake"
  ON public.context_intake FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all intake"
  ON public.context_intake FOR SELECT
  USING (true);
