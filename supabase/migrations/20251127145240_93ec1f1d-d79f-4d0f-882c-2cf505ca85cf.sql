-- Add support for individual itinerary discussions

-- Add optional reference to individual itineraries in discussions table
ALTER TABLE public.itinerary_discussions
ADD COLUMN itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE;

-- Add optional reference to individual itineraries in polls table
ALTER TABLE public.itinerary_polls
ADD COLUMN itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE;

-- Make group_itinerary_id nullable since we now support both group and individual
ALTER TABLE public.itinerary_discussions
ALTER COLUMN group_itinerary_id DROP NOT NULL;

ALTER TABLE public.itinerary_polls
ALTER COLUMN group_itinerary_id DROP NOT NULL;

-- Add constraint to ensure either group_itinerary_id or itinerary_id is set
ALTER TABLE public.itinerary_discussions
ADD CONSTRAINT check_itinerary_reference
CHECK (
  (group_itinerary_id IS NOT NULL AND itinerary_id IS NULL) OR
  (group_itinerary_id IS NULL AND itinerary_id IS NOT NULL)
);

ALTER TABLE public.itinerary_polls
ADD CONSTRAINT check_itinerary_reference
CHECK (
  (group_itinerary_id IS NOT NULL AND itinerary_id IS NULL) OR
  (group_itinerary_id IS NULL AND itinerary_id IS NOT NULL)
);

-- Create security definer function to check if user owns an itinerary
CREATE OR REPLACE FUNCTION public.user_owns_itinerary(
  _user_id UUID,
  _itinerary_id UUID
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM itineraries i
    INNER JOIN respondents r ON i.respondent_id = r.id
    WHERE i.id = _itinerary_id
      AND r.user_id = _user_id
  )
$$;

-- Create security definer function to check if user has access to a poll (group or individual)
CREATE OR REPLACE FUNCTION public.user_has_poll_access_v2(
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
    WHERE p.id = _poll_id
      AND (
        -- Check group access
        (p.group_itinerary_id IS NOT NULL AND public.user_has_group_itinerary(_user_id, p.group_itinerary_id))
        OR
        -- Check individual access
        (p.itinerary_id IS NOT NULL AND public.user_owns_itinerary(_user_id, p.itinerary_id))
      )
  )
$$;

-- Add new policies for individual itinerary discussions
CREATE POLICY "Users can view discussions for their itineraries"
ON public.itinerary_discussions
FOR SELECT
USING (
  (group_itinerary_id IS NOT NULL AND public.user_has_group_itinerary(auth.uid(), group_itinerary_id))
  OR
  (itinerary_id IS NOT NULL AND public.user_owns_itinerary(auth.uid(), itinerary_id))
);

CREATE POLICY "Users can create discussions for their itineraries"
ON public.itinerary_discussions
FOR INSERT
WITH CHECK (
  (group_itinerary_id IS NOT NULL AND public.user_has_group_itinerary(auth.uid(), group_itinerary_id))
  OR
  (itinerary_id IS NOT NULL AND public.user_owns_itinerary(auth.uid(), itinerary_id))
);

-- Add new policies for individual itinerary polls
CREATE POLICY "Users can view polls for their itineraries"
ON public.itinerary_polls
FOR SELECT
USING (
  (group_itinerary_id IS NOT NULL AND public.user_has_group_itinerary(auth.uid(), group_itinerary_id))
  OR
  (itinerary_id IS NOT NULL AND public.user_owns_itinerary(auth.uid(), itinerary_id))
);

CREATE POLICY "Users can create polls for their itineraries"
ON public.itinerary_polls
FOR INSERT
WITH CHECK (
  (group_itinerary_id IS NOT NULL AND public.user_has_group_itinerary(auth.uid(), group_itinerary_id))
  OR
  (itinerary_id IS NOT NULL AND public.user_owns_itinerary(auth.uid(), itinerary_id))
);

-- Update poll votes policy to use new function
DROP POLICY IF EXISTS "Users can view votes for polls in their groups" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can vote on polls in their groups" ON public.poll_votes;

CREATE POLICY "Users can view votes for accessible polls"
ON public.poll_votes
FOR SELECT
USING (public.user_has_poll_access_v2(auth.uid(), poll_id));

CREATE POLICY "Users can vote on accessible polls"
ON public.poll_votes
FOR INSERT
WITH CHECK (public.user_has_poll_access_v2(auth.uid(), poll_id));