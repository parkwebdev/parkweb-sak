-- Update RLS policy to allow public SOW creation for client onboarding
DROP POLICY IF EXISTS "Users can create their own scope of works" ON public.scope_of_works;

CREATE POLICY "Users can create their own scope of works" 
ON public.scope_of_works 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to create their own SOWs
  (auth.uid() = user_id) 
  OR 
  -- Allow public SOW creation (from client onboarding forms)
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Also update select policy to allow viewing public SOWs
DROP POLICY IF EXISTS "Users can view their own scope of works" ON public.scope_of_works;

CREATE POLICY "Users can view their own scope of works" 
ON public.scope_of_works 
FOR SELECT 
USING (
  -- Users can view their own authenticated SOWs
  (auth.uid() = user_id) 
  OR 
  -- Allow viewing public SOWs (for admin dashboard)
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid AND is_admin(auth.uid()))
);