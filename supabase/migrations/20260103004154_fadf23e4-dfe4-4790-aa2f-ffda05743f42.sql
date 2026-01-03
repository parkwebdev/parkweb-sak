-- Fix response_cache RLS policy: Replace permissive FOR ALL USING (true) policy
-- with proper policy that restricts access to authenticated users with agent access

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage response cache" ON response_cache;

-- Create proper SELECT policy for authenticated users
CREATE POLICY "Users can view cache for accessible agents"
ON response_cache FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents 
    WHERE agents.id = response_cache.agent_id 
    AND has_account_access(agents.user_id)
  )
);

-- Note: INSERT/UPDATE/DELETE are handled by edge functions using service role
-- which bypasses RLS entirely, so no additional policies needed

-- Add a comment explaining the security model
COMMENT ON POLICY "Users can view cache for accessible agents" ON response_cache IS 
  'Restricts cache reads to authenticated users who have access to the agent (owner or team member). Writes are done via service role in edge functions.';