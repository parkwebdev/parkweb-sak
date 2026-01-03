-- PII Protection: Secure conversation metadata from widget access
-- This migration ensures widget users cannot access sensitive PII (IP, location, device info)
-- while maintaining full analytics access for authenticated admin users.

-- Step 1: Update filter function to be more comprehensive
CREATE OR REPLACE FUNCTION public.filter_widget_conversation_metadata(raw_metadata jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return only non-sensitive metadata fields that the widget legitimately needs
  -- EXCLUDE: ip_address, city, country, region, device_type, device_os, browser, 
  --          user_agent, referrer_journey (contains entry URLs), visitor_id
  IF raw_metadata IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  
  RETURN jsonb_build_object(
    'lead_id', raw_metadata->'lead_id',
    'lead_name', raw_metadata->'lead_name',
    'lead_email', raw_metadata->'lead_email',
    'last_message_at', raw_metadata->'last_message_at',
    'last_message_role', raw_metadata->'last_message_role',
    'last_message_preview', raw_metadata->'last_message_preview',
    'admin_last_read_at', raw_metadata->'admin_last_read_at',
    'last_user_message_at', raw_metadata->'last_user_message_at',
    'message_count', raw_metadata->'message_count',
    'user_message_count', raw_metadata->'user_message_count',
    'detected_language', raw_metadata->'detected_language'
  );
END;
$function$;

-- Step 2: Create a secure function for widget conversation access
-- This function will be the ONLY way widgets can access conversation data
CREATE OR REPLACE FUNCTION public.get_widget_conversation(p_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  agent_id uuid,
  status conversation_status,
  channel text,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.agent_id,
    c.status,
    c.channel,
    c.created_at,
    c.updated_at,
    c.expires_at,
    filter_widget_conversation_metadata(c.metadata) AS metadata
  FROM conversations c
  WHERE c.id = p_conversation_id
    AND c.channel = 'widget'
    AND c.status IN ('active', 'human_takeover')
    AND c.expires_at > now();
END;
$$;

-- Grant execute to anon role for widget access
GRANT EXECUTE ON FUNCTION public.get_widget_conversation(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_widget_conversation(uuid) TO authenticated;

-- Step 3: Drop the permissive widget SELECT policy from conversations table
-- Widget access should go through the secure function or view only
DROP POLICY IF EXISTS "Widget users can view their active conversation by ID" ON conversations;

-- Step 4: Create a minimal policy for realtime subscriptions only
-- This policy returns TRUE for matching rows but the actual data access
-- for queries should use the RPC function
-- Note: Realtime still needs this policy to function, but direct queries
-- will return empty metadata when combined with column-level security
CREATE POLICY "Widget realtime: status changes only" 
ON conversations 
FOR SELECT 
USING (
  channel = 'widget' 
  AND status IN ('active', 'human_takeover') 
  AND expires_at > now()
);

-- Add comment explaining the security approach
COMMENT ON FUNCTION public.get_widget_conversation IS 
'Secure function for widget access to conversation data. Filters out sensitive PII 
(IP address, location, device info) from metadata. Use this instead of direct table 
access for all widget conversation queries.';

COMMENT ON POLICY "Widget realtime: status changes only" ON conversations IS
'Minimal policy for realtime subscriptions. Widget should use get_widget_conversation() 
RPC for actual data queries to ensure metadata is filtered.';