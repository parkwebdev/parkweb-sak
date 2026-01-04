-- Function to get user sessions from auth.sessions table
-- Required for the list-user-sessions edge function

CREATE OR REPLACE FUNCTION public.get_user_sessions(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_agent text,
  ip text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id, 
    s.created_at, 
    s.updated_at, 
    s.user_agent, 
    s.ip::text
  FROM auth.sessions s
  WHERE s.user_id = p_user_id
    AND s.not_after > now()  -- Only return active sessions
  ORDER BY s.updated_at DESC;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_user_sessions(uuid) TO service_role;