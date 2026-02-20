
-- Fix infinite recursion in group_members RLS policy
-- The current SELECT policy on group_members references group_members itself, causing infinite recursion
-- Fix by using a SECURITY DEFINER function

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view their own group members" ON public.group_members;

-- Create a security definer function to check group membership without recursion
CREATE OR REPLACE FUNCTION public.user_is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm
    INNER JOIN public.respondents r ON gm.respondent_id = r.id
    WHERE gm.group_id = _group_id
      AND r.user_id = _user_id
  )
$$;

-- Recreate the group_members SELECT policy using the security definer function
CREATE POLICY "Users can view their group members"
ON public.group_members
FOR SELECT
USING (user_is_group_member(auth.uid(), group_id));

-- Also fix groups SELECT policy to avoid potential recursion
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

CREATE POLICY "Users can view groups they are members of"
ON public.groups
FOR SELECT
USING (user_is_group_member(auth.uid(), id));
