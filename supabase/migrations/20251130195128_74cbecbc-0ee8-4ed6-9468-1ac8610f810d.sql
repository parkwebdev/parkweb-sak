-- Add new notification preference columns for ChatPad features
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS conversation_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS lead_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS agent_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS team_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS report_notifications boolean DEFAULT true;

-- Remove old columns that are no longer relevant
ALTER TABLE notification_preferences
DROP COLUMN IF EXISTS onboarding_notifications,
DROP COLUMN IF EXISTS scope_work_notifications;