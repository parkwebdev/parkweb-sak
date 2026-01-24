-- Drop the existing super_admin-only SELECT policy
DROP POLICY IF EXISTS "Super admins can view all team memberships" ON public.team_members;

-- Create new policy for all pilot team members (super_admin + pilot_support)
CREATE POLICY "Pilot team can view all team memberships"
ON public.team_members FOR SELECT
USING (is_pilot_team_member(auth.uid()));