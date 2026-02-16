
-- Step 1: Create admin role system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles (via security definer function to avoid recursion)
-- No direct client access to user_roles table
CREATE POLICY "No direct client reads on user_roles"
  ON public.user_roles FOR SELECT
  USING (false);

-- Step 2: Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 3: Drop all overly permissive "Admin" policies and replace with role-based ones

-- === respondents ===
DROP POLICY IF EXISTS "Admin can view all respondents" ON public.respondents;
DROP POLICY IF EXISTS "Admin can insert respondents" ON public.respondents;
DROP POLICY IF EXISTS "Admin can update respondents" ON public.respondents;
DROP POLICY IF EXISTS "Admin can update payment status" ON public.respondents;

CREATE POLICY "Admins can view all respondents"
  ON public.respondents FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert respondents"
  ON public.respondents FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update respondents"
  ON public.respondents FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- === computed_scores ===
DROP POLICY IF EXISTS "Admin can view all scores" ON public.computed_scores;
DROP POLICY IF EXISTS "Admin can insert scores" ON public.computed_scores;

CREATE POLICY "Admins can view all scores"
  ON public.computed_scores FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scores"
  ON public.computed_scores FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own scores
CREATE POLICY "Users can view own scores"
  ON public.computed_scores FOR SELECT
  TO authenticated
  USING (respondent_id IN (SELECT id FROM respondents WHERE user_id = auth.uid()));

-- === narrative_insights ===
DROP POLICY IF EXISTS "Admin can view all narratives" ON public.narrative_insights;
DROP POLICY IF EXISTS "Admin can insert narratives" ON public.narrative_insights;

CREATE POLICY "Admins can view all narratives"
  ON public.narrative_insights FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert narratives"
  ON public.narrative_insights FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own narratives
CREATE POLICY "Users can view own narratives"
  ON public.narrative_insights FOR SELECT
  TO authenticated
  USING (respondent_id IN (SELECT id FROM respondents WHERE user_id = auth.uid()));

-- === echoprint_destinations ===
DROP POLICY IF EXISTS "Admin can insert destinations" ON public.echoprint_destinations;
DROP POLICY IF EXISTS "Admin can update destinations" ON public.echoprint_destinations;
DROP POLICY IF EXISTS "Admin can delete destinations" ON public.echoprint_destinations;

CREATE POLICY "Admins can insert destinations"
  ON public.echoprint_destinations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update destinations"
  ON public.echoprint_destinations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete destinations"
  ON public.echoprint_destinations FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- === destination_info ===
DROP POLICY IF EXISTS "Admin can manage destination info" ON public.destination_info;

CREATE POLICY "Admins can manage destination info"
  ON public.destination_info FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === destination_matches ===
DROP POLICY IF EXISTS "Admin can view all matches" ON public.destination_matches;
DROP POLICY IF EXISTS "Admin can delete matches" ON public.destination_matches;
DROP POLICY IF EXISTS "Service can insert matches" ON public.destination_matches;

CREATE POLICY "Admins can view all matches"
  ON public.destination_matches FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete matches"
  ON public.destination_matches FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service inserts are done via service_role key in edge functions, no RLS policy needed

-- === ai_conversations ===
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.ai_conversations;

CREATE POLICY "Admins can view all conversations"
  ON public.ai_conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update conversations"
  ON public.ai_conversations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- === ai_messages ===
DROP POLICY IF EXISTS "Admins can view all messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.ai_messages;
DROP POLICY IF EXISTS "Service can insert messages" ON public.ai_messages;

CREATE POLICY "Admins can view all messages"
  ON public.ai_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service inserts done via service_role key, no permissive RLS needed

-- === itineraries ===
DROP POLICY IF EXISTS "Admin can view all itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Admin can insert itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Admin can update itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Admin can delete itineraries" ON public.itineraries;

CREATE POLICY "Admins can view all itineraries"
  ON public.itineraries FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert itineraries"
  ON public.itineraries FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update itineraries"
  ON public.itineraries FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete itineraries"
  ON public.itineraries FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own itineraries
CREATE POLICY "Users can view own itineraries"
  ON public.itineraries FOR SELECT
  TO authenticated
  USING (respondent_id IN (SELECT id FROM respondents WHERE user_id = auth.uid()));

-- === groups ===
DROP POLICY IF EXISTS "Authenticated users can view all groups" ON public.groups;
-- Keep the user-specific policy that already exists

-- === group_members ===
DROP POLICY IF EXISTS "Authenticated users can view all group members" ON public.group_members;
-- Keep the user-specific policy that already exists

-- === group_itineraries ===
DROP POLICY IF EXISTS "Admins can manage group itineraries" ON public.group_itineraries;

CREATE POLICY "Admins can manage group itineraries"
  ON public.group_itineraries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- === itinerary_discussions ===
DROP POLICY IF EXISTS "Authenticated users can view all discussions" ON public.itinerary_discussions;
DROP POLICY IF EXISTS "Authenticated users can delete discussions" ON public.itinerary_discussions;
-- Keep user-specific policies that already exist

-- === itinerary_polls ===
DROP POLICY IF EXISTS "Authenticated users can manage polls" ON public.itinerary_polls;
DROP POLICY IF EXISTS "Authenticated users can view all polls" ON public.itinerary_polls;
-- Keep user-specific policies that already exist

-- === poll_votes ===
DROP POLICY IF EXISTS "Admins can view all votes" ON public.poll_votes;

CREATE POLICY "Admins can view all votes"
  ON public.poll_votes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- === questionnaire_analytics ===
DROP POLICY IF EXISTS "Admin can view all analytics" ON public.questionnaire_analytics;

CREATE POLICY "Admins can view all analytics"
  ON public.questionnaire_analytics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- === questionnaire_variants ===
DROP POLICY IF EXISTS "Admin can view all variants" ON public.questionnaire_variants;
DROP POLICY IF EXISTS "Admin can insert variants" ON public.questionnaire_variants;
DROP POLICY IF EXISTS "Admin can update variants" ON public.questionnaire_variants;
DROP POLICY IF EXISTS "Admin can delete variants" ON public.questionnaire_variants;

CREATE POLICY "Admins can view all variants"
  ON public.questionnaire_variants FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert variants"
  ON public.questionnaire_variants FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update variants"
  ON public.questionnaire_variants FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete variants"
  ON public.questionnaire_variants FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- === context_intake ===
DROP POLICY IF EXISTS "Admin can view all intake" ON public.context_intake;

CREATE POLICY "Admins can view all intake"
  ON public.context_intake FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- === mood_logs ===
DROP POLICY IF EXISTS "Authenticated users can view all mood logs" ON public.mood_logs;
-- Keep user-specific policies

-- === mood_insights ===
DROP POLICY IF EXISTS "Authenticated users can view all insights" ON public.mood_insights;
-- Keep user-specific policies

-- === trip_reflections ===
DROP POLICY IF EXISTS "Authenticated users can view all reflections" ON public.trip_reflections;
-- Keep user-specific policies

-- === trip_members ===
DROP POLICY IF EXISTS "Anyone can view by invitation token" ON public.trip_members;

-- Allow viewing by invitation token specifically (not wide open)
CREATE POLICY "Users can view by invitation token"
  ON public.trip_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_is_trip_creator(auth.uid(), trip_id)
  );

-- Step 4: Fix storage policies for trip-documents
DROP POLICY IF EXISTS "Authenticated users can upload trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their trip documents" ON storage.objects;

-- Users can only upload to their own folder: {user_id}/{filename}
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trip-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view files in their own folder
CREATE POLICY "Users can view own trip documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'trip-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete files in their own folder
CREATE POLICY "Users can delete own trip documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trip-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Also allow users to read/select variants (needed for questionnaire display)
CREATE POLICY "Anyone can view active variants"
  ON public.questionnaire_variants FOR SELECT
  TO authenticated
  USING (is_active = true);
