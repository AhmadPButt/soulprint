
-- Allow admins to view all groups
CREATE POLICY "Admins can view all groups"
ON public.groups
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all group members  
CREATE POLICY "Admins can view all group members"
ON public.group_members
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
