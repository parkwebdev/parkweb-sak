-- Add columns to pending_invitations for Pilot team invites
ALTER TABLE public.pending_invitations
ADD COLUMN IF NOT EXISTS is_pilot_invite boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pilot_role text;

-- Add admin_permissions column to user_roles for granular Pilot team access
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS admin_permissions text[] DEFAULT '{}';

-- Create index for faster Pilot invite lookups
CREATE INDEX IF NOT EXISTS idx_pending_invitations_pilot ON public.pending_invitations (email, is_pilot_invite) WHERE is_pilot_invite = true;