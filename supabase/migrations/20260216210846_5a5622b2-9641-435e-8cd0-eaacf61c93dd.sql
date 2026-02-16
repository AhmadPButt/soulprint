
-- Create a SECURITY DEFINER function to check trip ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.user_is_trip_creator(_user_id uuid, _trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips WHERE id = _trip_id AND created_by = _user_id
  )
$$;

-- Create a SECURITY DEFINER function to check trip membership without triggering RLS
CREATE OR REPLACE FUNCTION public.user_is_trip_member(_user_id uuid, _trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members WHERE trip_id = _trip_id AND user_id = _user_id
  )
$$;

-- Fix trip_members policies to use the helper function instead of subquerying trips
DROP POLICY IF EXISTS "Trip creators can view members" ON trip_members;
CREATE POLICY "Trip creators can view members" ON trip_members
  FOR SELECT USING (user_is_trip_creator(auth.uid(), trip_id));

DROP POLICY IF EXISTS "Trip creators can insert members" ON trip_members;
CREATE POLICY "Trip creators can insert members" ON trip_members
  FOR INSERT WITH CHECK (user_is_trip_creator(auth.uid(), trip_id));

DROP POLICY IF EXISTS "Trip creators can update members" ON trip_members;
CREATE POLICY "Trip creators can update members" ON trip_members
  FOR UPDATE USING (user_is_trip_creator(auth.uid(), trip_id));

DROP POLICY IF EXISTS "Trip creators can delete members" ON trip_members;
CREATE POLICY "Trip creators can delete members" ON trip_members
  FOR DELETE USING (user_is_trip_creator(auth.uid(), trip_id));

-- Fix trips "Members can view" policy to use the helper function
DROP POLICY IF EXISTS "Members can view their trips" ON trips;
CREATE POLICY "Members can view their trips" ON trips
  FOR SELECT USING (user_is_trip_member(auth.uid(), id));

-- Fix trip_bookings policies
DROP POLICY IF EXISTS "Trip creators can manage bookings" ON trip_bookings;
CREATE POLICY "Trip creators can manage bookings" ON trip_bookings
  FOR ALL USING (user_is_trip_creator(auth.uid(), trip_id));

DROP POLICY IF EXISTS "Trip members can view bookings" ON trip_bookings;
CREATE POLICY "Trip members can view bookings" ON trip_bookings
  FOR SELECT USING (user_is_trip_member(auth.uid(), trip_id));

-- Fix trip_documents policies
DROP POLICY IF EXISTS "Trip creators can manage documents" ON trip_documents;
CREATE POLICY "Trip creators can manage documents" ON trip_documents
  FOR ALL USING (user_is_trip_creator(auth.uid(), trip_id));

DROP POLICY IF EXISTS "Trip members can view documents" ON trip_documents;
CREATE POLICY "Trip members can view documents" ON trip_documents
  FOR SELECT USING (user_is_trip_member(auth.uid(), trip_id));
