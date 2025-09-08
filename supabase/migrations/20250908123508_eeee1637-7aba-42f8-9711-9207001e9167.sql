-- Fix critical security vulnerability in pending_invitations table
-- Current policy allows anyone to view all invitations, exposing email addresses

-- Drop the insecure policy
DROP POLICY IF EXISTS "Users can view pending invitations" ON public.pending_invitations;

-- Create a secure policy that only allows:
-- 1. The user who created the invitation to view it
-- 2. Admins to view all invitations for management purposes
CREATE POLICY "Users can view their own invitations" 
ON public.pending_invitations 
FOR SELECT 
USING (
  auth.uid() = invited_by OR is_admin(auth.uid())
);