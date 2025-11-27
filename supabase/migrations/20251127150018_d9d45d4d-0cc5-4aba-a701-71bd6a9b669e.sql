-- Add payment tracking columns to respondents table
ALTER TABLE public.respondents 
ADD COLUMN paid_flights boolean DEFAULT false,
ADD COLUMN paid_hotels boolean DEFAULT false,
ADD COLUMN paid_activities boolean DEFAULT false;

-- Add RLS policy for admin to update payment status
CREATE POLICY "Admin can update payment status"
ON public.respondents
FOR UPDATE
USING (true)
WITH CHECK (true);