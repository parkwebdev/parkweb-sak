-- Fix: Remove overly permissive UPDATE policy on pending_invitations
-- The "System can update invitations" policy allows anyone to update any invitation

-- Drop the permissive policy
DROP POLICY IF EXISTS "System can update invitations" ON pending_invitations;

-- Create a restricted policy that only allows:
-- 1. The inviter to update their own invitations (e.g., to cancel)
-- 2. Service role (edge functions) will bypass RLS anyway
CREATE POLICY "Inviters can update their own invitations"
ON pending_invitations
FOR UPDATE
USING (auth.uid() = invited_by)
WITH CHECK (auth.uid() = invited_by);