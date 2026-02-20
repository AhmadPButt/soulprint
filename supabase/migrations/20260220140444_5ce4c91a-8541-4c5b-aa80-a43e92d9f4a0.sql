-- Add admin RLS policies for trips table so admins can view and update all trips
CREATE POLICY "Admins can view all trips"
ON public.trips
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all trips"
ON public.trips
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));