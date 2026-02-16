
-- Add trip_id column to mood_logs to link mood entries to specific trips
ALTER TABLE mood_logs 
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id);

-- Create index for efficient trip-based queries
CREATE INDEX IF NOT EXISTS idx_mood_logs_trip ON mood_logs(trip_id);

-- RLS policy: users can insert mood logs for trips they are members of
DROP POLICY IF EXISTS "Users can insert mood logs for their trips" ON mood_logs;
CREATE POLICY "Users can insert mood logs for their trips" ON mood_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM respondents r WHERE r.id = respondent_id AND r.user_id = auth.uid()
    )
  );

-- RLS policy: users can view their own mood logs
DROP POLICY IF EXISTS "Users can view their own mood logs" ON mood_logs;
CREATE POLICY "Users can view their own mood logs" ON mood_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM respondents r WHERE r.id = respondent_id AND r.user_id = auth.uid()
    )
  );
