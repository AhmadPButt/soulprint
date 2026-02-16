
-- Create trips table
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_name VARCHAR(200) NOT NULL,
  created_by UUID NOT NULL,
  trip_type VARCHAR(50) NOT NULL DEFAULT 'solo',
  status VARCHAR(50) DEFAULT 'planning',
  destination_id UUID REFERENCES public.echoprint_destinations(id),
  context_intake_id UUID REFERENCES public.context_intake(id),
  respondent_id UUID REFERENCES public.respondents(id),
  itinerary_id UUID REFERENCES public.itineraries(id),
  start_date DATE,
  end_date DATE,
  budget_range VARCHAR(50),
  fora_itinerary_url TEXT,
  fora_booking_id VARCHAR(100),
  consultation_booked BOOLEAN DEFAULT false,
  consultation_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trips_created_by ON public.trips(created_by);
CREATE INDEX idx_trips_status ON public.trips(status);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trips" ON public.trips
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own trips" ON public.trips
  FOR DELETE USING (auth.uid() = created_by);

-- Create trip_members table
CREATE TABLE public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  invitation_status VARCHAR(50) DEFAULT 'pending',
  respondent_id UUID REFERENCES public.respondents(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  invitation_token UUID DEFAULT gen_random_uuid(),
  UNIQUE(trip_id, email)
);

CREATE INDEX idx_trip_members_trip ON public.trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON public.trip_members(user_id);
CREATE INDEX idx_trip_members_token ON public.trip_members(invitation_token);

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- Trip creator can manage members
CREATE POLICY "Trip creators can view members" ON public.trip_members
  FOR SELECT USING (
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid())
  );

CREATE POLICY "Trip creators can insert members" ON public.trip_members
  FOR INSERT WITH CHECK (
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid())
  );

CREATE POLICY "Trip creators can update members" ON public.trip_members
  FOR UPDATE USING (
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid())
  );

CREATE POLICY "Trip creators can delete members" ON public.trip_members
  FOR DELETE USING (
    trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid())
  );

-- Members can view their own membership
CREATE POLICY "Users can view their own memberships" ON public.trip_members
  FOR SELECT USING (user_id = auth.uid());

-- Members can update their own membership (accept invitation)
CREATE POLICY "Users can update their own membership" ON public.trip_members
  FOR UPDATE USING (user_id = auth.uid());

-- Users viewing trips they are members of
CREATE POLICY "Members can view their trips" ON public.trips
  FOR SELECT USING (
    id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid())
  );

-- Anyone can view by invitation token (for join page)
CREATE POLICY "Anyone can view by invitation token" ON public.trip_members
  FOR SELECT USING (true);
