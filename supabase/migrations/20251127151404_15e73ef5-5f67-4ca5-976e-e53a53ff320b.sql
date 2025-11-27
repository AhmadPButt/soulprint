-- Create mood_logs table for tracking emotional fluctuations during trip
CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID NOT NULL REFERENCES public.respondents(id) ON DELETE CASCADE,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  emotions JSONB,
  notes TEXT,
  location TEXT,
  activity_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own mood logs
CREATE POLICY "Users can view their own mood logs"
ON public.mood_logs
FOR SELECT
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own mood logs"
ON public.mood_logs
FOR INSERT
TO authenticated
WITH CHECK (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own mood logs"
ON public.mood_logs
FOR UPDATE
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);

-- Admins can view all mood logs
CREATE POLICY "Authenticated users can view all mood logs"
ON public.mood_logs
FOR SELECT
TO authenticated
USING (true);

-- Create index for better performance
CREATE INDEX idx_mood_logs_respondent_id ON public.mood_logs(respondent_id);
CREATE INDEX idx_mood_logs_logged_at ON public.mood_logs(logged_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mood_logs;