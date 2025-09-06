-- Update Aaron to admin role and set super-admin
UPDATE public.user_roles 
SET role = 'admin'::app_role
WHERE user_id = (
  SELECT user_id FROM public.profiles 
  WHERE email = 'aaron@park-web.com' 
  LIMIT 1
);

-- Set the first user as super-admin (assuming that's you)
UPDATE public.user_roles 
SET role = 'super_admin'::app_role
WHERE user_id = (
  SELECT user_id FROM public.profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Update RLS policy for super-admin capabilities
DROP POLICY IF EXISTS "Admins and super-admins can manage user roles" ON public.user_roles;

CREATE POLICY "Admins and super-admins can manage user roles" ON public.user_roles 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);