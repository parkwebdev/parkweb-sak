-- Phase 1: Add webhook tracking columns to connected_accounts
-- These columns track Google/Outlook calendar webhook subscriptions for real-time sync

ALTER TABLE public.connected_accounts 
ADD COLUMN IF NOT EXISTS webhook_channel_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_resource_id TEXT,
ADD COLUMN IF NOT EXISTS webhook_expires_at TIMESTAMPTZ;

-- Add index for efficient webhook renewal queries (find expiring webhooks)
CREATE INDEX IF NOT EXISTS idx_connected_accounts_webhook_expires 
ON public.connected_accounts (webhook_expires_at) 
WHERE webhook_expires_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.connected_accounts.webhook_channel_id IS 'Unique channel ID for Google Calendar push notifications or Outlook subscription ID';
COMMENT ON COLUMN public.connected_accounts.webhook_resource_id IS 'Resource ID returned by Google Calendar watch API';
COMMENT ON COLUMN public.connected_accounts.webhook_expires_at IS 'When the webhook subscription expires and needs renewal';