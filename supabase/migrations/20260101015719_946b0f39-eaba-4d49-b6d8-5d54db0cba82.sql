-- Add email-specific notification preference columns for granular control
ALTER TABLE public.notification_preferences 
  ADD COLUMN IF NOT EXISTS booking_email_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS lead_email_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS team_email_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS agent_email_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_email_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_email_notifications boolean DEFAULT true;