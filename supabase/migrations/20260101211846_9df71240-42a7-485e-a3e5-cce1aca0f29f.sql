-- Add timezone column to scheduled_reports table
ALTER TABLE scheduled_reports 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

COMMENT ON COLUMN scheduled_reports.timezone IS 'IANA timezone identifier for when to send the report';