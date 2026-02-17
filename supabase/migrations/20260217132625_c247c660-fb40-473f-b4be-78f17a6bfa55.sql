
-- Create table for server-side questionnaire progress persistence
CREATE TABLE public.questionnaire_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_section INTEGER NOT NULL DEFAULT 0,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT questionnaire_progress_user_id_unique UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.questionnaire_progress ENABLE ROW LEVEL SECURITY;

-- Users can only access their own progress
CREATE POLICY "Users can view own progress"
  ON public.questionnaire_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.questionnaire_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.questionnaire_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.questionnaire_progress FOR DELETE
  USING (auth.uid() = user_id);
