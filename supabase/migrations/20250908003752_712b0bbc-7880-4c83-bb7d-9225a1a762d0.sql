-- Fix security vulnerability: Remove public read access to scope_of_works and onboarding_submissions
-- while preserving the ability for anonymous clients to submit data

-- Update scope_of_works policies to remove public read access
DROP POLICY IF EXISTS "Users can view their own scope of works" ON public.scope_of_works;
DROP POLICY IF EXISTS "Users can update their own scope of works" ON public.scope_of_works;
DROP POLICY IF EXISTS "Users can delete their own scope of works" ON public.scope_of_works;
DROP POLICY IF EXISTS "Users can create their own scope of works" ON public.scope_of_works;

-- Create new secure policies for scope_of_works
CREATE POLICY "Users can view their own scope of works" ON public.scope_of_works
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scope of works" ON public.scope_of_works
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid AND auth.uid() IS NULL)
);

CREATE POLICY "Users can update their own scope of works" ON public.scope_of_works
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scope of works" ON public.scope_of_works
FOR DELETE 
USING (auth.uid() = user_id);

-- Update onboarding_submissions policies to remove public read access
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.onboarding_submissions;
DROP POLICY IF EXISTS "Users can create submissions" ON public.onboarding_submissions;

-- Create new secure policies for onboarding_submissions
CREATE POLICY "Users can view their own submissions" ON public.onboarding_submissions
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create submissions" ON public.onboarding_submissions
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid AND auth.uid() IS NULL)
);

CREATE POLICY "Users can update their own submissions" ON public.onboarding_submissions
FOR UPDATE 
USING (auth.uid() = user_id);