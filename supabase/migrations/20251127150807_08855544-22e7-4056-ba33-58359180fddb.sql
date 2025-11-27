-- Fix RLS policies to allow authenticated users (admin) to view all data
-- This is a temporary solution - proper admin role system should be implemented

-- Update policies to allow authenticated users to view discussions and polls
DROP POLICY IF EXISTS "Service role can view all discussions" ON public.itinerary_discussions;
DROP POLICY IF EXISTS "Service role can delete any discussion" ON public.itinerary_discussions;
DROP POLICY IF EXISTS "Service role can view all polls" ON public.itinerary_polls;
DROP POLICY IF EXISTS "Service role can manage all polls" ON public.itinerary_polls;
DROP POLICY IF EXISTS "Service role can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Service role can view all group members" ON public.group_members;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view all discussions"
ON public.itinerary_discussions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete discussions"
ON public.itinerary_discussions
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all polls"
ON public.itinerary_polls
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage polls"
ON public.itinerary_polls
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all groups"
ON public.groups
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);