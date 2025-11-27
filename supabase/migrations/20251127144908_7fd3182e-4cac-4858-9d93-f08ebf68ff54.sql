-- Fix infinite recursion in RLS policies by using security definer functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view discussions for their groups" ON public.itinerary_discussions;
DROP POLICY IF EXISTS "Users can create discussions for their groups" ON public.itinerary_discussions;
DROP POLICY IF EXISTS "Users can view polls for their groups" ON public.itinerary_polls;
DROP POLICY IF EXISTS "Users can create polls for their groups" ON public.itinerary_polls;
DROP POLICY IF EXISTS "Users can view votes for polls in their groups" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can vote on polls in their groups" ON public.poll_votes;

-- Create security definer function to check if user is in a group with an itinerary
CREATE OR REPLACE FUNCTION public.user_has_group_itinerary(
  _user_id UUID,
  _group_itinerary_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_itineraries gi
    INNER JOIN group_members gm ON gi.group_id = gm.group_id
    INNER JOIN respondents r ON gm.respondent_id = r.id
    WHERE gi.id = _group_itinerary_id
      AND r.user_id = _user_id
  )
$$;

-- Create security definer function to check if user is in a group with a poll
CREATE OR REPLACE FUNCTION public.user_has_poll_access(
  _user_id UUID,
  _poll_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM itinerary_polls p
    INNER JOIN group_itineraries gi ON p.group_itinerary_id = gi.id
    INNER JOIN group_members gm ON gi.group_id = gm.group_id
    INNER JOIN respondents r ON gm.respondent_id = r.id
    WHERE p.id = _poll_id
      AND r.user_id = _user_id
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view discussions for their groups"
ON public.itinerary_discussions
FOR SELECT
USING (public.user_has_group_itinerary(auth.uid(), group_itinerary_id));

CREATE POLICY "Users can create discussions for their groups"
ON public.itinerary_discussions
FOR INSERT
WITH CHECK (public.user_has_group_itinerary(auth.uid(), group_itinerary_id));

CREATE POLICY "Users can view polls for their groups"
ON public.itinerary_polls
FOR SELECT
USING (public.user_has_group_itinerary(auth.uid(), group_itinerary_id));

CREATE POLICY "Users can create polls for their groups"
ON public.itinerary_polls
FOR INSERT
WITH CHECK (public.user_has_group_itinerary(auth.uid(), group_itinerary_id));

CREATE POLICY "Users can view votes for polls in their groups"
ON public.poll_votes
FOR SELECT
USING (public.user_has_poll_access(auth.uid(), poll_id));

CREATE POLICY "Users can vote on polls in their groups"
ON public.poll_votes
FOR INSERT
WITH CHECK (public.user_has_poll_access(auth.uid(), poll_id));