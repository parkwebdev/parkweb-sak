-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.has_permission(UUID, app_permission);

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id UUID)
RETURNS app_role 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT COALESCE(role, 'member'::app_role) 
  FROM public.user_roles 
  WHERE user_id = target_user_id;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(target_user_id UUID, permission_name app_permission)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND (role = 'admin' OR permission_name = ANY(permissions))
  );
$$;