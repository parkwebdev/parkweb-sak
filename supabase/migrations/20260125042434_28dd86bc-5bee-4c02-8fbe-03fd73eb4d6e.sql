-- Add per-type push notification preference columns
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS push_lead_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS push_conversation_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS push_booking_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS push_team_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS push_message_notifications boolean DEFAULT true;