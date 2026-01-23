-- Update get_team_profiles to support impersonation sessions
-- This allows admins with active impersonation sessions to view the target user's team

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
    -- Original checks: user is the owner or a team member
    auth.uid() = p_owner_id 
    OR EXISTS (SELECT 1 FROM team_members WHERE owner_id = p_owner_id AND member_id = auth.uid())
    -- NEW: Allow access if caller has an active impersonation session for this owner
    OR EXISTS (
      SELECT 1 FROM impersonation_sessions
      WHERE admin_user_id = auth.uid()
        AND target_user_id = p_owner_id
        AND is_active = true
        AND started_at > now() - interval '30 minutes'
    )
  );
$$;