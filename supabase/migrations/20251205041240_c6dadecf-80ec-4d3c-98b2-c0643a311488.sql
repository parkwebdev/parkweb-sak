-- Add endpoint_url, headers, and timeout_ms columns to agent_tools for tool calling
ALTER TABLE agent_tools 
ADD COLUMN IF NOT EXISTS endpoint_url TEXT,
ADD COLUMN IF NOT EXISTS headers JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timeout_ms INTEGER DEFAULT 10000;

-- Add comment for documentation
COMMENT ON COLUMN agent_tools.endpoint_url IS 'The webhook URL to call when tool is invoked by AI';
COMMENT ON COLUMN agent_tools.headers IS 'Custom headers to include with tool requests (e.g., auth tokens)';
COMMENT ON COLUMN agent_tools.timeout_ms IS 'Request timeout in milliseconds (default 10 seconds)';