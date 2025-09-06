-- Temporarily disable problematic RLS policies to break the infinite loop
DROP POLICY IF EXISTS "Admins and super-admins can manage user roles" ON public.user_roles;

-- Create a simpler policy that allows basic access
CREATE POLICY "Allow authenticated users to read user roles" ON public.user_roles FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to manage their own records initially 
CREATE POLICY "Allow users to manage own user role" ON public.user_roles 
FOR ALL USING (user_id = auth.uid());