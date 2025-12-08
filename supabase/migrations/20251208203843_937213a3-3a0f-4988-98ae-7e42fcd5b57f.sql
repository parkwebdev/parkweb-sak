-- Fix: Change view to SECURITY INVOKER to respect RLS policies
-- Drop and recreate the view with proper security settings

DROP VIEW IF EXISTS public.widget_conversations_secure;

-- Recreate view with SECURITY INVOKER (default, explicit for clarity)
-- The view relies on the underlying table's RLS policies
CREATE VIEW public.widget_conversations_secure 
WITH (security_invoker = true)
AS
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

-- Re-grant SELECT on the view
GRANT SELECT ON public.widget_conversations_secure TO anon;
GRANT SELECT ON public.widget_conversations_secure TO authenticated;

-- Update comment
COMMENT ON VIEW public.widget_conversations_secure IS 'Secure INVOKER view for widget access that filters out sensitive metadata (IP, location, device info). Uses underlying table RLS policies for access control.';