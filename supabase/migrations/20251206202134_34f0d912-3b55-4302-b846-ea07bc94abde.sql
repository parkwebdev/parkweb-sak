-- =====================================================
-- Phase 1: Tighten agent_api_keys RLS policies
-- Change from public to authenticated role
-- =====================================================

DROP POLICY IF EXISTS "Users can view API keys for accessible agents" ON agent_api_keys;
DROP POLICY IF EXISTS "Users can create API keys for accessible agents" ON agent_api_keys;
DROP POLICY IF EXISTS "Users can update API keys for accessible agents" ON agent_api_keys;
DROP POLICY IF EXISTS "Users can delete API keys for accessible agents" ON agent_api_keys;

CREATE POLICY "Authenticated users can view API keys for accessible agents" ON agent_api_keys
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_api_keys.agent_id AND has_account_access(agents.user_id)));

CREATE POLICY "Authenticated users can create API keys for accessible agents" ON agent_api_keys
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_api_keys.agent_id AND has_account_access(agents.user_id)));

CREATE POLICY "Authenticated users can update API keys for accessible agents" ON agent_api_keys
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_api_keys.agent_id AND has_account_access(agents.user_id)));

CREATE POLICY "Authenticated users can delete API keys for accessible agents" ON agent_api_keys
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM agents WHERE agents.id = agent_api_keys.agent_id AND has_account_access(agents.user_id)));

-- =====================================================
-- Phase 2: Tighten webhooks RLS policies
-- Change from public to authenticated role
-- Fix SELECT to allow team access (consistent with UPDATE/DELETE)
-- =====================================================

DROP POLICY IF EXISTS "Users can only view their own webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can create webhooks for their agents" ON webhooks;
DROP POLICY IF EXISTS "Users can update accessible webhooks" ON webhooks;
DROP POLICY IF EXISTS "Users can delete accessible webhooks" ON webhooks;

CREATE POLICY "Authenticated users can view accessible webhooks" ON webhooks
  FOR SELECT TO authenticated
  USING (has_account_access(user_id) OR (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  )));

CREATE POLICY "Authenticated users can create webhooks" ON webhooks
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND (agent_id IS NULL OR EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  )));

CREATE POLICY "Authenticated users can update accessible webhooks" ON webhooks
  FOR UPDATE TO authenticated
  USING (has_account_access(user_id) OR (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  )));

CREATE POLICY "Authenticated users can delete accessible webhooks" ON webhooks
  FOR DELETE TO authenticated
  USING (has_account_access(user_id) OR (agent_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM agents WHERE agents.id = webhooks.agent_id AND has_account_access(agents.user_id)
  )));

-- =====================================================
-- Phase 3: Tighten webhook_logs RLS policy
-- Change from public to authenticated role
-- =====================================================

DROP POLICY IF EXISTS "Users can view accessible webhook logs" ON webhook_logs;

CREATE POLICY "Authenticated users can view accessible webhook logs" ON webhook_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM webhooks WHERE webhooks.id = webhook_logs.webhook_id AND has_account_access(webhooks.user_id)));

-- =====================================================
-- Phase 4: Add audit logging trigger for API key changes
-- Logs creation and revocation to security_logs
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_api_key_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO security_logs (user_id, action, resource_type, resource_id, success, details)
    VALUES (
      auth.uid(),
      'api_key_created',
      'agent_api_keys',
      NEW.id::text,
      true,
      jsonb_build_object('agent_id', NEW.agent_id, 'key_name', NEW.name, 'key_prefix', NEW.key_prefix)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
    INSERT INTO security_logs (user_id, action, resource_type, resource_id, success, details)
    VALUES (
      auth.uid(),
      'api_key_revoked',
      'agent_api_keys',
      NEW.id::text,
      true,
      jsonb_build_object('agent_id', NEW.agent_id, 'key_name', NEW.name, 'key_prefix', NEW.key_prefix)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_log_api_key_changes ON agent_api_keys;
CREATE TRIGGER trigger_log_api_key_changes
  AFTER INSERT OR UPDATE ON agent_api_keys
  FOR EACH ROW EXECUTE FUNCTION log_api_key_changes();