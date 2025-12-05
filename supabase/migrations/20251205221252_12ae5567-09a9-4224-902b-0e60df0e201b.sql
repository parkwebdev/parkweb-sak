-- Drop the overly permissive team profiles policy that exposes emails
DROP POLICY IF EXISTS "Team members can view account profiles" ON public.profiles;

-- Create a more restrictive policy that only exposes non-sensitive profile data
-- Team members can see display_name and avatar_url but NOT email
-- This is handled by having separate queries in the app - team views don't include email

-- Create a function to check if user is viewing for team display (no email needed)
CREATE OR REPLACE FUNCTION public.get_team_profiles(p_owner_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.user_id IN (
    SELECT tm.member_id FROM team_members tm WHERE tm.owner_id = p_owner_id
    UNION
    SELECT p_owner_id
  )
  AND (
    auth.uid() = p_owner_id 
    OR EXISTS (SELECT 1 FROM team_members WHERE owner_id = p_owner_id AND member_id = auth.uid())
  );
$$;

-- Re-add team member profile viewing with limited scope (avatar + display name only via function)
-- Keep direct profile access for admins only
CREATE POLICY "Team members can view team avatars and names"
ON public.profiles
FOR SELECT
USING (
  -- User can see their own full profile
  auth.uid() = user_id
  -- Super admins can see all
  OR is_super_admin(auth.uid())
);

-- Note: Team member listing should use get_team_profiles() function instead of direct table access