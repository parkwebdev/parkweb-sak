-- Create agent_api_keys table for API authentication with rate limiting
CREATE TABLE public.agent_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  requests_per_day INTEGER NOT NULL DEFAULT 10000,
  current_minute_requests INTEGER NOT NULL DEFAULT 0,
  current_day_requests INTEGER NOT NULL DEFAULT 0,
  minute_window_start TIMESTAMPTZ,
  day_window_start TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Create index for fast lookups by key_hash
CREATE INDEX idx_agent_api_keys_key_hash ON public.agent_api_keys(key_hash) WHERE revoked_at IS NULL;

-- Create index for agent lookups
CREATE INDEX idx_agent_api_keys_agent_id ON public.agent_api_keys(agent_id);

-- Enable RLS
ALTER TABLE public.agent_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view API keys for their accessible agents
CREATE POLICY "Users can view API keys for accessible agents"
ON public.agent_api_keys
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM agents
  WHERE agents.id = agent_api_keys.agent_id
  AND has_account_access(agents.user_id)
));

-- Users can create API keys for their accessible agents
CREATE POLICY "Users can create API keys for accessible agents"
ON public.agent_api_keys
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM agents
  WHERE agents.id = agent_api_keys.agent_id
  AND has_account_access(agents.user_id)
));

-- Users can update API keys for their accessible agents
CREATE POLICY "Users can update API keys for accessible agents"
ON public.agent_api_keys
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM agents
  WHERE agents.id = agent_api_keys.agent_id
  AND has_account_access(agents.user_id)
));

-- Users can delete API keys for their accessible agents
CREATE POLICY "Users can delete API keys for accessible agents"
ON public.agent_api_keys
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM agents
  WHERE agents.id = agent_api_keys.agent_id
  AND has_account_access(agents.user_id)
));

-- Create function to validate and rate-limit API key
CREATE OR REPLACE FUNCTION public.validate_api_key(p_key_hash TEXT, p_agent_id UUID)
RETURNS TABLE(valid BOOLEAN, key_id UUID, rate_limited BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_key RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Find the key
  SELECT * INTO v_key
  FROM agent_api_keys
  WHERE key_hash = p_key_hash
    AND agent_id = p_agent_id
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, false, 'Invalid API key'::TEXT;
    RETURN;
  END IF;

  -- Check and reset minute window
  IF v_key.minute_window_start IS NULL OR v_now - v_key.minute_window_start > interval '1 minute' THEN
    UPDATE agent_api_keys
    SET minute_window_start = v_now, current_minute_requests = 1, last_used_at = v_now
    WHERE id = v_key.id;
  ELSE
    -- Check rate limit per minute
    IF v_key.current_minute_requests >= v_key.requests_per_minute THEN
      RETURN QUERY SELECT true, v_key.id, true, 'Rate limit exceeded (per minute)'::TEXT;
      RETURN;
    END IF;
    
    UPDATE agent_api_keys
    SET current_minute_requests = current_minute_requests + 1, last_used_at = v_now
    WHERE id = v_key.id;
  END IF;

  -- Check and reset day window
  IF v_key.day_window_start IS NULL OR v_now - v_key.day_window_start > interval '1 day' THEN
    UPDATE agent_api_keys
    SET day_window_start = v_now, current_day_requests = 1
    WHERE id = v_key.id;
  ELSE
    -- Check rate limit per day
    IF v_key.current_day_requests >= v_key.requests_per_day THEN
      RETURN QUERY SELECT true, v_key.id, true, 'Rate limit exceeded (per day)'::TEXT;
      RETURN;
    END IF;
    
    UPDATE agent_api_keys
    SET current_day_requests = current_day_requests + 1
    WHERE id = v_key.id;
  END IF;

  RETURN QUERY SELECT true, v_key.id, false, NULL::TEXT;
END;
$$;