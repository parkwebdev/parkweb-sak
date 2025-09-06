-- Fix the user_roles RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to read user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to manage own user role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all user roles" ON public.user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read for authenticated users" ON public.user_roles
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for users" ON public.user_roles
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for users" ON public.user_roles
FOR UPDATE USING (user_id = auth.uid());

-- Allow admins to manage all roles (using security definer function to avoid recursion)
CREATE POLICY "Enable admin management" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur2 
    WHERE ur2.user_id = auth.uid() 
    AND ur2.role IN ('admin', 'super_admin')
  )
);