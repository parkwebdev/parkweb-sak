-- Update the RLS policy for scope_of_works to allow deleting anonymous SOWs
DROP POLICY IF EXISTS "Users can delete their own scope of works" ON public.scope_of_works;

CREATE POLICY "Users can delete their own scope of works" 
ON public.scope_of_works 
FOR DELETE 
USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));