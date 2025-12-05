-- Drop the overly permissive public insert policy
DROP POLICY IF EXISTS "Public can create conversations" ON public.conversations;

-- Only authenticated users can create conversations directly
CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);