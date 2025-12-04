-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view messages for realtime" ON messages;

-- Create a more restrictive policy that only allows access to messages
-- from active, non-expired conversations
CREATE POLICY "Public can view messages for active conversations"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.status IN ('active', 'human_takeover')
    AND c.expires_at > now()
  )
);

-- Add index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_conversations_status_expires 
ON conversations(status, expires_at);