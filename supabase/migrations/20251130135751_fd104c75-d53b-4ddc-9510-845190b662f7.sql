-- Secure profiles table by ensuring only authenticated users can access it
-- Drop existing SELECT policies and recreate them with explicit authentication requirements

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate SELECT policies with explicit authentication requirement
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Add explicit deny policy for public/anonymous access
-- This ensures profiles are never accidentally exposed to unauthenticated users
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR SELECT
TO anon, public
USING (false);