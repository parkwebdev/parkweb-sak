-- Drop the overly permissive public insert policy
DROP POLICY IF EXISTS "Public can create leads via widget" ON public.leads;

-- Create a new policy that only allows authenticated users to insert leads
CREATE POLICY "Authenticated users can create leads" 
ON public.leads 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);