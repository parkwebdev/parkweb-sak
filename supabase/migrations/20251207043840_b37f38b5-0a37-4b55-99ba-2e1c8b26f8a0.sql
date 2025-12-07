-- Drop existing SELECT policies on profiles that may be overly permissive
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Team members can view team avatars and names" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new, secure SELECT policies

-- 1. Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

-- 2. Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
ON profiles FOR SELECT
USING (is_super_admin(auth.uid()));

-- 3. Team members can view profiles within their account (owner sees team, team sees owner and each other)
CREATE POLICY "Team members can view profiles in same account"
ON profiles FOR SELECT
USING (
  get_account_owner_id() IS NOT NULL
  AND (
    -- Profile belongs to the account owner
    user_id = get_account_owner_id()
    OR
    -- Profile belongs to a team member under the same owner
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = get_account_owner_id()
      AND tm.member_id = user_id
    )
  )
);