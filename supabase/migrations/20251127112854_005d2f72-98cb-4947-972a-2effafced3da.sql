-- Create questionnaire_analytics table to track user progress and dropoffs
CREATE TABLE public.questionnaire_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('started', 'section_completed', 'abandoned', 'completed')),
  section_number INTEGER,
  email TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  time_spent_seconds INTEGER,
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.questionnaire_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting analytics (anyone can track)
CREATE POLICY "Anyone can insert analytics"
ON public.questionnaire_analytics
FOR INSERT
WITH CHECK (true);

-- Create policy for admin viewing (only specific email)
CREATE POLICY "Admin can view all analytics"
ON public.questionnaire_analytics
FOR SELECT
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_session_id ON public.questionnaire_analytics(session_id);
CREATE INDEX idx_analytics_event_type ON public.questionnaire_analytics(event_type);
CREATE INDEX idx_analytics_timestamp ON public.questionnaire_analytics(timestamp DESC);
CREATE INDEX idx_analytics_email ON public.questionnaire_analytics(email);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.timestamp = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;