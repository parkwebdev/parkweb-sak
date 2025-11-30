-- Enable RLS on all tables (if not already enabled)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- AGENTS TABLE POLICIES
-- =====================================================

-- Users can view their own agents or agents they have team access to
CREATE POLICY "Users can view accessible agents"
ON agents FOR SELECT
TO authenticated
USING (has_account_access(user_id));

-- Users can create agents for their own account
CREATE POLICY "Users can create their own agents"
ON agents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update agents they own or have team access to
CREATE POLICY "Users can update accessible agents"
ON agents FOR UPDATE
TO authenticated
USING (has_account_access(user_id));

-- Users can delete agents they own or have team access to
CREATE POLICY "Users can delete accessible agents"
ON agents FOR DELETE
TO authenticated
USING (has_account_access(user_id));

-- =====================================================
-- AGENT_TOOLS TABLE POLICIES
-- =====================================================

-- Users can view tools for agents they have access to
CREATE POLICY "Users can view accessible agent tools"
ON agent_tools FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_tools.agent_id
    AND has_account_access(agents.user_id)
  )
);

-- Users can create tools for agents they have access to
CREATE POLICY "Users can create tools for accessible agents"
ON agent_tools FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_tools.agent_id
    AND has_account_access(agents.user_id)
  )
);

-- Users can update tools for agents they have access to
CREATE POLICY "Users can update accessible agent tools"
ON agent_tools FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_tools.agent_id
    AND has_account_access(agents.user_id)
  )
);

-- Users can delete tools for agents they have access to
CREATE POLICY "Users can delete accessible agent tools"
ON agent_tools FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = agent_tools.agent_id
    AND has_account_access(agents.user_id)
  )
);

-- =====================================================
-- KNOWLEDGE_SOURCES TABLE POLICIES
-- =====================================================

-- Users can view knowledge sources for agents they have access to
CREATE POLICY "Users can view accessible knowledge sources"
ON knowledge_sources FOR SELECT
TO authenticated
USING (has_account_access(user_id));

-- Users can create knowledge sources for agents they have access to
CREATE POLICY "Users can create knowledge sources for accessible agents"
ON knowledge_sources FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents
    WHERE agents.id = knowledge_sources.agent_id
    AND has_account_access(agents.user_id)
  )
);

-- Users can update knowledge sources for agents they have access to
CREATE POLICY "Users can update accessible knowledge sources"
ON knowledge_sources FOR UPDATE
TO authenticated
USING (has_account_access(user_id));

-- Users can delete knowledge sources for agents they have access to
CREATE POLICY "Users can delete accessible knowledge sources"
ON knowledge_sources FOR DELETE
TO authenticated
USING (has_account_access(user_id));

-- =====================================================
-- API_KEYS TABLE POLICIES
-- =====================================================

-- Users can view their own API keys or keys they have team access to
CREATE POLICY "Users can view accessible api keys"
ON api_keys FOR SELECT
TO authenticated
USING (has_account_access(user_id));

-- Users can create their own API keys
CREATE POLICY "Users can create their own api keys"
ON api_keys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys or keys they have team access to
CREATE POLICY "Users can update accessible api keys"
ON api_keys FOR UPDATE
TO authenticated
USING (has_account_access(user_id));

-- Users can delete their own API keys or keys they have team access to
CREATE POLICY "Users can delete accessible api keys"
ON api_keys FOR DELETE
TO authenticated
USING (has_account_access(user_id));

-- =====================================================
-- CUSTOM_DOMAINS TABLE POLICIES
-- =====================================================

-- Users can view their own custom domains or domains they have team access to
CREATE POLICY "Users can view accessible custom domains"
ON custom_domains FOR SELECT
TO authenticated
USING (has_account_access(user_id));

-- Users can create their own custom domains
CREATE POLICY "Users can create their own custom domains"
ON custom_domains FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own custom domains or domains they have team access to
CREATE POLICY "Users can update accessible custom domains"
ON custom_domains FOR UPDATE
TO authenticated
USING (has_account_access(user_id));

-- Users can delete their own custom domains or domains they have team access to
CREATE POLICY "Users can delete accessible custom domains"
ON custom_domains FOR DELETE
TO authenticated
USING (has_account_access(user_id));

-- =====================================================
-- SCHEDULED_REPORTS TABLE POLICIES
-- =====================================================

-- Users can view their own scheduled reports or reports they have team access to
CREATE POLICY "Users can view accessible scheduled reports"
ON scheduled_reports FOR SELECT
TO authenticated
USING (has_account_access(user_id));

-- Users can create their own scheduled reports
CREATE POLICY "Users can create their own scheduled reports"
ON scheduled_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

-- Users can update their own scheduled reports or reports they have team access to
CREATE POLICY "Users can update accessible scheduled reports"
ON scheduled_reports FOR UPDATE
TO authenticated
USING (has_account_access(user_id));

-- Users can delete their own scheduled reports or reports they have team access to
CREATE POLICY "Users can delete accessible scheduled reports"
ON scheduled_reports FOR DELETE
TO authenticated
USING (has_account_access(user_id));

-- =====================================================
-- WEBHOOKS TABLE POLICIES
-- =====================================================

-- Users can view their own webhooks or webhooks they have team access to
CREATE POLICY "Users can view accessible webhooks"
ON webhooks FOR SELECT
TO authenticated
USING (has_account_access(user_id));

-- Users can create their own webhooks
CREATE POLICY "Users can create their own webhooks"
ON webhooks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own webhooks or webhooks they have team access to
CREATE POLICY "Users can update accessible webhooks"
ON webhooks FOR UPDATE
TO authenticated
USING (has_account_access(user_id));

-- Users can delete their own webhooks or webhooks they have team access to
CREATE POLICY "Users can delete accessible webhooks"
ON webhooks FOR DELETE
TO authenticated
USING (has_account_access(user_id));

-- =====================================================
-- WEBHOOK_LOGS TABLE POLICIES
-- =====================================================

-- Users can view logs for webhooks they have access to (read-only)
CREATE POLICY "Users can view accessible webhook logs"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM webhooks
    WHERE webhooks.id = webhook_logs.webhook_id
    AND has_account_access(webhooks.user_id)
  )
);