-- Fix the infinite recursion in RLS policy by using a security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE 
SET search_path = public
AS $$
  SELECT COALESCE(role, 'member'::app_role) 
  FROM public.user_roles 
  WHERE user_id = auth.uid();
$$;

-- Drop and recreate the problematic policy
DROP POLICY IF EXISTS "Admins and super-admins can manage user roles" ON public.user_roles;

CREATE POLICY "Admins and super-admins can manage user roles" ON public.user_roles 
FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'super_admin')
);