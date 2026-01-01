-- Allow admins to delete user roles for team members (not themselves)
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  -- Current user must be admin
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
  -- Cannot delete own role
  AND user_id != auth.uid()
);

-- Allow admins to delete profiles for team members (not themselves)
CREATE POLICY "Admins can delete team member profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  -- Current user must be admin
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
  )
  -- Cannot delete own profile
  AND user_id != auth.uid()
);