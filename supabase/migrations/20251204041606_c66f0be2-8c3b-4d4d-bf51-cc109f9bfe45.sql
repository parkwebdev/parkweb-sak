-- Add channel column to conversations table for multi-channel support
ALTER TABLE conversations 
ADD COLUMN channel text DEFAULT 'widget';

-- Add comment to explain valid values
COMMENT ON COLUMN conversations.channel IS 'Source channel: widget, facebook, instagram, x';