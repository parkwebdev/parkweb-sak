-- Allow super admins to view all team memberships
-- This is needed for the admin accounts page to resolve owner company info for team members
CREATE POLICY "Super admins can view all team memberships"
ON public.team_members
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Allow super admins to manage team memberships (for admin operations)
CREATE POLICY "Super admins can manage team memberships"
ON public.team_members
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));