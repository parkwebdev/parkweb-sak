-- Fix RLS policy to allow users to view their own SOWs and public SOWs they created
DROP POLICY IF EXISTS "Users can view their own scope of works" ON public.scope_of_works;

CREATE POLICY "Users can view their own scope of works" 
ON public.scope_of_works 
FOR SELECT 
USING (
  -- Users can view their own authenticated SOWs
  (auth.uid() = user_id) 
  OR 
  -- Allow viewing public SOWs (these are created from client onboarding)
  (user_id = '00000000-0000-0000-0000-000000000000'::uuid)
);