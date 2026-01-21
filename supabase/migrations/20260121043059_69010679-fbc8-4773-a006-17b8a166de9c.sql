-- Make has_account_access() impersonation-aware
-- This function is used by most RLS policies to check if a user can access account data
-- Previously it only checked auth.uid() directly, which doesn't work during impersonation
-- Now it uses get_account_owner_id() which already handles impersonation context

CREATE OR REPLACE FUNCTION public.has_account_access(account_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_owner_id uuid;
BEGIN
  -- Get the effective account owner ID (handles impersonation automatically)
  effective_owner_id := get_account_owner_id();
  
  -- If we couldn't determine an effective owner, deny access
  IF effective_owner_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if the row belongs to the effective owner's account
  -- OR if the effective owner is a team member of that account
  RETURN (
    account_owner_id = effective_owner_id
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE owner_id = account_owner_id
        AND member_id = effective_owner_id
    )
  );
END;
$$;