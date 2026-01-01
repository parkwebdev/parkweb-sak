-- Update the app_permission enum with new granular permissions
-- Need to handle dependencies properly

-- Step 1: Drop the has_permission function first (it depends on app_permission)
DROP FUNCTION IF EXISTS public.has_permission(uuid, app_permission);

-- Step 2: Remove the default on permissions column
ALTER TABLE public.user_roles 
  ALTER COLUMN permissions DROP DEFAULT;

-- Step 3: Convert permissions to text array temporarily
ALTER TABLE public.user_roles 
  ALTER COLUMN permissions TYPE text[] 
  USING permissions::text[];

-- Step 4: Now we can drop the old enum
DROP TYPE IF EXISTS public.app_permission;

-- Step 5: Create the new enum with all permissions
CREATE TYPE public.app_permission AS ENUM (
  -- Dashboard & Analytics
  'view_dashboard',
  -- Ari Agent
  'manage_ari',
  -- Conversations
  'view_conversations',
  'manage_conversations',
  -- Leads
  'view_leads',
  'manage_leads',
  -- Bookings
  'view_bookings',
  'manage_bookings',
  -- Knowledge Base
  'view_knowledge',
  'manage_knowledge',
  -- Help Center
  'view_help_articles',
  'manage_help_articles',
  -- Team
  'view_team',
  'manage_team',
  -- Settings
  'view_settings',
  'manage_settings',
  -- Billing
  'view_billing',
  'manage_billing',
  -- Integrations
  'view_integrations',
  'manage_integrations',
  -- Webhooks
  'view_webhooks',
  'manage_webhooks',
  -- API Keys
  'view_api_keys',
  'manage_api_keys'
);

-- Step 6: Migrate existing permissions to new format
UPDATE public.user_roles
SET permissions = ARRAY(
  SELECT DISTINCT CASE 
    WHEN p = 'manage_team' THEN 'manage_team'
    WHEN p = 'view_team' THEN 'view_team'
    WHEN p = 'manage_projects' THEN 'manage_leads'
    WHEN p = 'view_projects' THEN 'view_leads'
    WHEN p = 'manage_onboarding' THEN 'view_dashboard'
    WHEN p = 'view_onboarding' THEN 'view_dashboard'
    WHEN p = 'manage_scope_works' THEN 'manage_knowledge'
    WHEN p = 'view_scope_works' THEN 'view_knowledge'
    WHEN p = 'manage_settings' THEN 'manage_settings'
    WHEN p = 'view_settings' THEN 'view_settings'
    ELSE 'view_dashboard'
  END
  FROM unnest(permissions) AS p
)
WHERE permissions IS NOT NULL AND array_length(permissions, 1) > 0;

-- Step 7: Convert permissions column back to use the new enum
ALTER TABLE public.user_roles 
  ALTER COLUMN permissions TYPE public.app_permission[] 
  USING permissions::public.app_permission[];

-- Step 8: Recreate the has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(target_user_id uuid, permission_name app_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND (role IN ('admin', 'super_admin') OR permission_name = ANY(permissions))
  );
$$;