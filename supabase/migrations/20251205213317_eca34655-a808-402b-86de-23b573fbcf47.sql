-- Drop the overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Only super admins can view all profiles (system administration)
CREATE POLICY "Super admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_super_admin(auth.uid()));

-- Team members can view profiles within their account (needed for team management UI)
CREATE POLICY "Team members can view account profiles"
ON public.profiles
FOR SELECT
USING (
  -- Owner viewing their team member's profile
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE owner_id = auth.uid() AND member_id = profiles.user_id
  )
  OR
  -- Team member viewing their owner's profile
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE member_id = auth.uid() AND owner_id = profiles.user_id
  )
  OR
  -- Team member viewing fellow team member's profile (same owner)
  EXISTS (
    SELECT 1 FROM team_members tm1
    INNER JOIN team_members tm2 ON tm1.owner_id = tm2.owner_id
    WHERE tm1.member_id = auth.uid() AND tm2.member_id = profiles.user_id
  )
);