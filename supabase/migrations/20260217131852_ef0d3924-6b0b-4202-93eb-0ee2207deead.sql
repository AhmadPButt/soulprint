-- Add DELETE policy for mood_logs so users can delete their own mood entries
CREATE POLICY "Users can delete their own mood logs"
ON public.mood_logs
FOR DELETE
TO authenticated
USING (
  respondent_id IN (
    SELECT id FROM public.respondents WHERE user_id = auth.uid()
  )
);