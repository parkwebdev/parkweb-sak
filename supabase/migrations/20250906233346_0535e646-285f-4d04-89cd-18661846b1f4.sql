-- Fix critical security vulnerabilities

-- 1. Remove overly permissive profile policy and replace with secure one
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure profile policy - users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to view all profiles for team management
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- 2. Secure user_roles table - remove user self-update capability
DROP POLICY IF EXISTS "Enable update for users" ON public.user_roles;

-- Replace with admin-only update policy
CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- 3. Restrict user_roles SELECT policy to own data + admin override
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.user_roles;

CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- 4. Add audit logging function for role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    data
  ) VALUES (
    NEW.user_id,
    'Role Updated',
    'Your role has been changed to: ' || NEW.role,
    'security',
    jsonb_build_object(
      'old_role', OLD.role,
      'new_role', NEW.role,
      'changed_by', auth.uid(),
      'timestamp', now()
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Create trigger for role change auditing
CREATE TRIGGER audit_role_changes
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_role_change();