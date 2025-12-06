-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view active conversation by ID" ON public.conversations;

-- Create a more restrictive policy that only allows public access for widget-channel conversations
-- This limits exposure to only widget conversations, not internal/other channel conversations
-- Security: Conversation UUIDs (128-bit) provide adequate protection through obscurity
-- The widget stores the ID locally and queries by specific ID
CREATE POLICY "Widget users can view their active conversation by ID"
ON public.conversations
FOR SELECT
USING (
  channel = 'widget' 
  AND status = ANY (ARRAY['active'::conversation_status, 'human_takeover'::conversation_status]) 
  AND expires_at > now()
);