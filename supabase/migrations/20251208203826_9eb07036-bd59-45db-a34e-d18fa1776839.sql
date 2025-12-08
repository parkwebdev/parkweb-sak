-- Create a secure view for widget access that excludes sensitive metadata
-- This prevents exposure of IP addresses, device info, and location data to public widget users

-- First, create a function to filter sensitive fields from conversation metadata
CREATE OR REPLACE FUNCTION public.filter_widget_conversation_metadata(raw_metadata jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return only non-sensitive metadata fields that the widget needs
  -- Exclude: ip_address, city, country, device_type, device_os, browser, referrer journey details
  RETURN jsonb_build_object(
    'lead_id', raw_metadata->'lead_id',
    'lead_name', raw_metadata->'lead_name',
    'lead_email', raw_metadata->'lead_email',
    'last_message_at', raw_metadata->'last_message_at',
    'last_message_role', raw_metadata->'last_message_role',
    'last_message_preview', raw_metadata->'last_message_preview',
    'admin_last_read_at', raw_metadata->'admin_last_read_at',
    'last_user_message_at', raw_metadata->'last_user_message_at'
  );
END;
$$;

-- Create a secure view for widget conversation access
CREATE OR REPLACE VIEW public.widget_conversations_secure AS
SELECT 
  id,
  agent_id,
  status,
  channel,
  created_at,
  updated_at,
  expires_at,
  user_id,
  -- Use the filter function to exclude sensitive metadata
  public.filter_widget_conversation_metadata(metadata) AS metadata
FROM public.conversations
WHERE 
  channel = 'widget'
  AND status IN ('active', 'human_takeover')
  AND expires_at > now();

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.widget_conversations_secure TO anon;
GRANT SELECT ON public.widget_conversations_secure TO authenticated;

-- Add comment explaining the security purpose
COMMENT ON VIEW public.widget_conversations_secure IS 'Secure view for widget access that filters out sensitive metadata (IP, location, device info). Use this view instead of direct conversations table access for public widget queries.';

COMMENT ON FUNCTION public.filter_widget_conversation_metadata IS 'Filters conversation metadata to remove sensitive PII (IP address, location, device info) for safe public widget access.';