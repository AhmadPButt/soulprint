-- Add user_id column to respondents table to link with authenticated users
ALTER TABLE public.respondents
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for faster lookups
CREATE INDEX idx_respondents_user_id ON public.respondents(user_id);

-- Update RLS policies to work with authenticated users
DROP POLICY IF EXISTS "Admin can view all respondents" ON public.respondents;
DROP POLICY IF EXISTS "Admin can insert respondents" ON public.respondents;
DROP POLICY IF EXISTS "Admin can update respondents" ON public.respondents;

-- Allow authenticated users to insert their own responses
CREATE POLICY "Users can insert their own responses"
ON public.respondents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own responses
CREATE POLICY "Users can view their own responses"
ON public.respondents
FOR SELECT
USING (auth.uid() = user_id);

-- Admin can view all respondents (keep existing admin access)
CREATE POLICY "Admin can view all respondents"
ON public.respondents
FOR SELECT
USING (true);

-- Admin can insert respondents
CREATE POLICY "Admin can insert respondents"
ON public.respondents
FOR INSERT
WITH CHECK (true);

-- Admin can update respondents
CREATE POLICY "Admin can update respondents"
ON public.respondents
FOR UPDATE
USING (true);