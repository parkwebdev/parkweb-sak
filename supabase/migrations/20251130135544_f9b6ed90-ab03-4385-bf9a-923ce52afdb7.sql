-- Add RLS policies for leads table to protect customer data
-- Users can only view, update, and delete leads associated with their account

-- Policy: Users can view accessible leads
CREATE POLICY "Users can view accessible leads"
ON public.leads
FOR SELECT
TO authenticated
USING (has_account_access(user_id));

-- Policy: Users can update accessible leads
CREATE POLICY "Users can update accessible leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (has_account_access(user_id));

-- Policy: Users can delete accessible leads
CREATE POLICY "Users can delete accessible leads"
ON public.leads
FOR DELETE
TO authenticated
USING (has_account_access(user_id));