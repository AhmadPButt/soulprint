-- Create table for itinerary discussion comments
CREATE TABLE public.itinerary_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_itinerary_id UUID NOT NULL REFERENCES public.group_itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.itinerary_discussions(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'general',
  activity_reference TEXT,
  day_reference INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for polls and questions
CREATE TABLE public.itinerary_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_itinerary_id UUID NOT NULL REFERENCES public.group_itineraries(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  poll_type TEXT NOT NULL DEFAULT 'multiple_choice',
  options JSONB NOT NULL,
  activity_reference TEXT,
  day_reference INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closes_at TIMESTAMP WITH TIME ZONE
);

-- Create table for poll votes
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.itinerary_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.itinerary_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for itinerary_discussions
CREATE POLICY "Users can view discussions for their groups"
ON public.itinerary_discussions
FOR SELECT
USING (
  group_itinerary_id IN (
    SELECT gi.id
    FROM public.group_itineraries gi
    INNER JOIN public.group_members gm ON gi.group_id = gm.group_id
    INNER JOIN public.respondents r ON gm.respondent_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create discussions for their groups"
ON public.itinerary_discussions
FOR INSERT
WITH CHECK (
  group_itinerary_id IN (
    SELECT gi.id
    FROM public.group_itineraries gi
    INNER JOIN public.group_members gm ON gi.group_id = gm.group_id
    INNER JOIN public.respondents r ON gm.respondent_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own discussions"
ON public.itinerary_discussions
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own discussions"
ON public.itinerary_discussions
FOR DELETE
USING (user_id = auth.uid());

-- Admin policies for discussions
CREATE POLICY "Admins can view all discussions"
ON public.itinerary_discussions
FOR SELECT
USING (true);

CREATE POLICY "Admins can delete any discussion"
ON public.itinerary_discussions
FOR DELETE
USING (true);

-- RLS Policies for itinerary_polls
CREATE POLICY "Users can view polls for their groups"
ON public.itinerary_polls
FOR SELECT
USING (
  group_itinerary_id IN (
    SELECT gi.id
    FROM public.group_itineraries gi
    INNER JOIN public.group_members gm ON gi.group_id = gm.group_id
    INNER JOIN public.respondents r ON gm.respondent_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create polls for their groups"
ON public.itinerary_polls
FOR INSERT
WITH CHECK (
  group_itinerary_id IN (
    SELECT gi.id
    FROM public.group_itineraries gi
    INNER JOIN public.group_members gm ON gi.group_id = gm.group_id
    INNER JOIN public.respondents r ON gm.respondent_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all polls"
ON public.itinerary_polls
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all polls"
ON public.itinerary_polls
FOR ALL
USING (true);

-- RLS Policies for poll_votes
CREATE POLICY "Users can view votes for polls in their groups"
ON public.poll_votes
FOR SELECT
USING (
  poll_id IN (
    SELECT p.id
    FROM public.itinerary_polls p
    INNER JOIN public.group_itineraries gi ON p.group_itinerary_id = gi.id
    INNER JOIN public.group_members gm ON gi.group_id = gm.group_id
    INNER JOIN public.respondents r ON gm.respondent_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Users can vote on polls in their groups"
ON public.poll_votes
FOR INSERT
WITH CHECK (
  poll_id IN (
    SELECT p.id
    FROM public.itinerary_polls p
    INNER JOIN public.group_itineraries gi ON p.group_itinerary_id = gi.id
    INNER JOIN public.group_members gm ON gi.group_id = gm.group_id
    INNER JOIN public.respondents r ON gm.respondent_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all votes"
ON public.poll_votes
FOR SELECT
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_itinerary_discussions_updated_at
BEFORE UPDATE ON public.itinerary_discussions
FOR EACH ROW
EXECUTE FUNCTION public.update_itineraries_updated_at();