-- Add HTTP method, authentication type, and auth config to webhooks table
ALTER TABLE public.webhooks 
ADD COLUMN method text NOT NULL DEFAULT 'POST',
ADD COLUMN auth_type text NOT NULL DEFAULT 'none',
ADD COLUMN auth_config jsonb DEFAULT '{}'::jsonb;

-- Add comment to describe the columns
COMMENT ON COLUMN public.webhooks.method IS 'HTTP method to use (GET, POST, PUT, PATCH, DELETE)';
COMMENT ON COLUMN public.webhooks.auth_type IS 'Authentication type (none, api_key, bearer_token, basic_auth)';
COMMENT ON COLUMN public.webhooks.auth_config IS 'Authentication configuration (structure varies by auth_type)';