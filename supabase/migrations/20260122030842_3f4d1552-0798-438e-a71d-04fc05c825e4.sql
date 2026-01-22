-- Add pilot_admin_permissions column to pending_invitations table
-- This stores the selected permissions during the invite flow
ALTER TABLE pending_invitations 
ADD COLUMN IF NOT EXISTS pilot_admin_permissions TEXT[] DEFAULT '{}';