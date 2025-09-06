-- Create roles and user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'member');

CREATE TYPE public.app_permission AS ENUM (
  'manage_team',
  'view_team', 
  'manage_projects',
  'view_projects',
  'manage_onboarding',
  'view_onboarding',
  'manage_scope_works',
  'view_scope_works',
  'manage_settings',
  'view_settings'
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  permissions app_permission[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user preferences table for auto-save and compact mode
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  auto_save BOOLEAN DEFAULT true,
  compact_mode BOOLEAN DEFAULT false,
  default_project_view TEXT DEFAULT 'dashboard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view all user roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage all user roles" ON public.user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);
CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- RLS policies for user_preferences  
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences FOR ALL USING (user_id = auth.uid());

-- Function to get user role safely
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id UUID)
RETURNS app_role AS $$
  SELECT COALESCE(role, 'member'::app_role) 
  FROM public.user_roles 
  WHERE user_id = target_user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(target_user_id UUID, permission_name app_permission)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND (role = 'admin' OR permission_name = ANY(permissions))
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create trigger for updating timestamps
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Give the current user admin role (replace with actual user_id if known)
INSERT INTO public.user_roles (user_id, role, permissions)
SELECT user_id, 'admin'::app_role, ARRAY[
  'manage_team'::app_permission,
  'view_team'::app_permission,
  'manage_projects'::app_permission,
  'view_projects'::app_permission,
  'manage_onboarding'::app_permission,
  'view_onboarding'::app_permission,
  'manage_scope_works'::app_permission,
  'view_scope_works'::app_permission,
  'manage_settings'::app_permission,
  'view_settings'::app_permission
] FROM public.profiles LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin'::app_role,
  permissions = ARRAY[
    'manage_team'::app_permission,
    'view_team'::app_permission,
    'manage_projects'::app_permission,
    'view_projects'::app_permission,
    'manage_onboarding'::app_permission,
    'view_onboarding'::app_permission,
    'manage_scope_works'::app_permission,
    'view_scope_works'::app_permission,
    'manage_settings'::app_permission,
    'view_settings'::app_permission
  ];