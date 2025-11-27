-- Create groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code TEXT NOT NULL UNIQUE,
  creator_id UUID REFERENCES public.respondents(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  respondent_id UUID REFERENCES public.respondents(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, respondent_id)
);

-- Create group_itineraries table
CREATE TABLE public.group_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL UNIQUE,
  itinerary_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_itineraries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can view groups they are members of"
  ON public.groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM public.group_members 
      WHERE respondent_id IN (
        SELECT id FROM public.respondents WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (
    creator_id IN (
      SELECT id FROM public.respondents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all groups"
  ON public.groups FOR SELECT
  USING (true);

-- RLS Policies for group_members
CREATE POLICY "Users can view members of their groups"
  ON public.group_members FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE respondent_id IN (
        SELECT id FROM public.respondents WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    respondent_id IN (
      SELECT id FROM public.respondents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all group members"
  ON public.group_members FOR SELECT
  USING (true);

-- RLS Policies for group_itineraries
CREATE POLICY "Users can view their group itineraries"
  ON public.group_itineraries FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE respondent_id IN (
        SELECT id FROM public.respondents WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage group itineraries"
  ON public.group_itineraries FOR ALL
  USING (true);

-- Function to generate unique join codes
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.groups WHERE join_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger to update group updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_itineraries_updated_at();

CREATE TRIGGER update_group_itineraries_updated_at
  BEFORE UPDATE ON public.group_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_itineraries_updated_at();