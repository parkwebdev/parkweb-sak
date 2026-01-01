-- Add name columns to pending_invitations for personalized invitations
ALTER TABLE pending_invitations 
ADD COLUMN invited_first_name text,
ADD COLUMN invited_last_name text;