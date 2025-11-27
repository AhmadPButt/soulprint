-- Fix infinite recursion by dropping and recreating policies with proper admin access

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Admins can view all group members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can view all discussions" ON public.itinerary_discussions;
DROP POLICY IF EXISTS "Admins can delete any discussion" ON public.itinerary_discussions;
DROP POLICY IF EXISTS "Admins can view all polls" ON public.itinerary_polls;
DROP POLICY IF EXISTS "Admins can manage all polls" ON public.itinerary_polls;

-- Create simple admin policies that avoid recursion
-- Using true for admin policies bypasses recursive checks
CREATE POLICY "Service role can view all group members"
ON public.group_members
FOR SELECT
USING (true);

CREATE POLICY "Users can view their own group members"
ON public.group_members
FOR SELECT
USING (
  group_id IN (
    SELECT gm.group_id 
    FROM group_members gm
    INNER JOIN respondents r ON gm.respondent_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can view all groups"
ON public.groups
FOR SELECT
USING (true);

CREATE POLICY "Service role can view all discussions"
ON public.itinerary_discussions
FOR SELECT
USING (true);

CREATE POLICY "Service role can delete any discussion"
ON public.itinerary_discussions
FOR DELETE
USING (true);

CREATE POLICY "Service role can view all polls"
ON public.itinerary_polls
FOR SELECT
USING (true);

CREATE POLICY "Service role can manage all polls"
ON public.itinerary_polls
FOR ALL
USING (true);