-- Update RLS policy to allow public submissions for client onboarding
DROP POLICY IF EXISTS "Users can create submissions" ON public.onboarding_submissions;

CREATE POLICY "Users can create submissions" 
ON public.onboarding_submissions 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to create their own submissions
  (auth.uid() = user_id) 
  OR 
  -- Allow public submissions (client onboarding forms)
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Also update select policy to allow users to view public submissions they created
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.onboarding_submissions;

CREATE POLICY "Users can view their own submissions" 
ON public.onboarding_submissions 
FOR SELECT 
USING (
  -- Users can view their own authenticated submissions
  (auth.uid() = user_id) 
  OR 
  -- Allow viewing public submissions (for admin dashboard)
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid AND is_admin(auth.uid()))
);