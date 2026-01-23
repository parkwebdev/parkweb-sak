-- =====================================================
-- Migration: Fix Admin RLS Policies for Pilot Team
-- =====================================================

-- Step 1: Create helper function to check if user is a Pilot team member
CREATE OR REPLACE FUNCTION public.is_pilot_team_member(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND role IN ('super_admin', 'pilot_support')
  );
$$;

-- Step 2: Create function to check granular admin permissions
CREATE OR REPLACE FUNCTION public.has_admin_permission(target_user_id uuid, permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND (
      role = 'super_admin'  -- Super admins have all permissions
      OR permission = ANY(admin_permissions::text[])
    )
  );
$$;

-- =====================================================
-- Step 3: Update RLS Policies
-- =====================================================

-- 3a. Profiles - Allow pilot team to view all profiles
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

CREATE POLICY "Pilot team can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  is_pilot_team_member(auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members 
    WHERE owner_id = profiles.user_id AND member_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM team_members
    WHERE owner_id = auth.uid() AND member_id = profiles.user_id
  )
);

-- 3b. Platform HC Articles
DROP POLICY IF EXISTS "Super admins can manage platform HC articles" ON platform_hc_articles;

CREATE POLICY "Pilot team with content permission can view articles"
ON platform_hc_articles FOR SELECT
TO authenticated
USING (has_admin_permission(auth.uid(), 'view_content'));

CREATE POLICY "Pilot team with content permission can manage articles"
ON platform_hc_articles FOR ALL
TO authenticated
USING (has_admin_permission(auth.uid(), 'manage_content'))
WITH CHECK (has_admin_permission(auth.uid(), 'manage_content'));

-- 3c. Platform HC Categories
DROP POLICY IF EXISTS "Super admins can manage platform HC categories" ON platform_hc_categories;

CREATE POLICY "Pilot team with content permission can view categories"
ON platform_hc_categories FOR SELECT
TO authenticated
USING (has_admin_permission(auth.uid(), 'view_content'));

CREATE POLICY "Pilot team with content permission can manage categories"
ON platform_hc_categories FOR ALL
TO authenticated
USING (has_admin_permission(auth.uid(), 'manage_content'))
WITH CHECK (has_admin_permission(auth.uid(), 'manage_content'));

-- 3d. Admin Audit Log
DROP POLICY IF EXISTS "Super admins can view audit logs" ON admin_audit_log;
DROP POLICY IF EXISTS "Super admins can create audit logs" ON admin_audit_log;

CREATE POLICY "Pilot team can view audit logs"
ON admin_audit_log FOR SELECT
TO authenticated
USING (is_pilot_team_member(auth.uid()));

CREATE POLICY "Pilot team can create audit logs"
ON admin_audit_log FOR INSERT
TO authenticated
WITH CHECK (is_pilot_team_member(auth.uid()));

-- 3e. Plans Table
DROP POLICY IF EXISTS "Super admins can manage plans" ON plans;

CREATE POLICY "Pilot team with revenue permission can view plans"
ON plans FOR SELECT
TO authenticated
USING (has_admin_permission(auth.uid(), 'view_revenue'));

CREATE POLICY "Pilot team with revenue permission can manage plans"
ON plans FOR ALL
TO authenticated
USING (has_admin_permission(auth.uid(), 'manage_revenue'))
WITH CHECK (has_admin_permission(auth.uid(), 'manage_revenue'));

-- 3f. Impersonation Sessions
DROP POLICY IF EXISTS "Super admins can manage impersonation sessions" ON impersonation_sessions;

CREATE POLICY "Pilot team with impersonation permission can manage sessions"
ON impersonation_sessions FOR ALL
TO authenticated
USING (has_admin_permission(auth.uid(), 'impersonate_users'))
WITH CHECK (has_admin_permission(auth.uid(), 'impersonate_users'));

-- 3g. Email Templates
DROP POLICY IF EXISTS "Super admins can manage email templates" ON email_templates;

CREATE POLICY "Pilot team with content permission can view email templates"
ON email_templates FOR SELECT
TO authenticated
USING (has_admin_permission(auth.uid(), 'view_content'));

CREATE POLICY "Pilot team with content permission can manage email templates"
ON email_templates FOR ALL
TO authenticated
USING (has_admin_permission(auth.uid(), 'manage_content'))
WITH CHECK (has_admin_permission(auth.uid(), 'manage_content'));

-- 3h. Email Delivery Logs
DROP POLICY IF EXISTS "Super admins can view email logs" ON email_delivery_logs;

CREATE POLICY "Pilot team can view email logs"
ON email_delivery_logs FOR SELECT
TO authenticated
USING (is_pilot_team_member(auth.uid()));

-- 3i. Platform Config
DROP POLICY IF EXISTS "Super admins can view platform config" ON platform_config;
DROP POLICY IF EXISTS "Super admins can manage platform config" ON platform_config;

CREATE POLICY "Pilot team with settings permission can view config"
ON platform_config FOR SELECT
TO authenticated
USING (has_admin_permission(auth.uid(), 'view_settings'));

CREATE POLICY "Pilot team with settings permission can manage config"
ON platform_config FOR ALL
TO authenticated
USING (has_admin_permission(auth.uid(), 'manage_settings'))
WITH CHECK (has_admin_permission(auth.uid(), 'manage_settings'));

-- 3j. User Roles - Pilot team management
DROP POLICY IF EXISTS "Only super admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON user_roles;

CREATE POLICY "Pilot team can view all roles"
ON user_roles FOR SELECT
TO authenticated
USING (
  is_pilot_team_member(auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Pilot team with team permission can insert roles"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (has_admin_permission(auth.uid(), 'manage_team'));

CREATE POLICY "Pilot team with team permission can update roles"
ON user_roles FOR UPDATE
TO authenticated
USING (has_admin_permission(auth.uid(), 'manage_team'))
WITH CHECK (has_admin_permission(auth.uid(), 'manage_team'));

-- 3k. Pending Invitations
DROP POLICY IF EXISTS "Super admins can manage invitations" ON pending_invitations;

CREATE POLICY "Pilot team with team permission can view invitations"
ON pending_invitations FOR SELECT
TO authenticated
USING (
  has_admin_permission(auth.uid(), 'view_team')
  OR invited_by = auth.uid()
);

CREATE POLICY "Pilot team with team permission can manage invitations"
ON pending_invitations FOR ALL
TO authenticated
USING (has_admin_permission(auth.uid(), 'manage_team'))
WITH CHECK (has_admin_permission(auth.uid(), 'manage_team'));

-- 3l. Subscriptions - Allow pilot team to view
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON subscriptions;

CREATE POLICY "Pilot team with revenue permission can view subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  has_admin_permission(auth.uid(), 'view_revenue')
  OR has_account_access(user_id)
);