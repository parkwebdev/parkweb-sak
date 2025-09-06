-- Create security definer function to check admin status (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Enable admin management" ON public.user_roles;

-- Create new admin management policy using security definer function
CREATE POLICY "Enable admin management" ON public.user_roles
FOR ALL USING (public.is_admin(auth.uid()));

-- Clean up test data - remove Jacob Holley (test account)
DELETE FROM public.profiles WHERE email = 'jacob@supabase.com';
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT user_id FROM public.profiles WHERE email = 'jacob@supabase.com'
);

-- Ensure jacob@park-web.com has a proper role assignment
INSERT INTO public.user_roles (user_id, role, permissions)
SELECT 
  p.user_id, 
  'member'::app_role, 
  ARRAY['view_team', 'view_projects', 'view_onboarding', 'view_scope_works']::app_permission[]
FROM public.profiles p 
WHERE p.email = 'jacob@park-web.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
);