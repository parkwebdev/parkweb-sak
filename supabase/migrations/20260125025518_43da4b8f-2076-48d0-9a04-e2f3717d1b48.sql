-- Add dedicated weekly report toggle and timezone columns
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_report_timezone TEXT DEFAULT 'America/New_York';

-- Add comment for documentation
COMMENT ON COLUMN notification_preferences.weekly_report_enabled IS 'Toggle for receiving weekly analytics digest every Monday';
COMMENT ON COLUMN notification_preferences.weekly_report_timezone IS 'User timezone for 8 AM weekly report delivery';