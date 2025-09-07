-- Update the RLS policy for scope_of_works to allow updating anonymous SOWs
DROP POLICY IF EXISTS "Users can update their own scope of works" ON public.scope_of_works;

CREATE POLICY "Users can update their own scope of works" 
ON public.scope_of_works 
FOR UPDATE 
USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));