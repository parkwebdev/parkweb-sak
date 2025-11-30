-- Drop old org_id columns
ALTER TABLE agents DROP COLUMN IF EXISTS org_id;
ALTER TABLE announcements DROP COLUMN IF EXISTS org_id;
ALTER TABLE api_keys DROP COLUMN IF EXISTS org_id;
ALTER TABLE conversations DROP COLUMN IF EXISTS org_id;
ALTER TABLE custom_domains DROP COLUMN IF EXISTS org_id;
ALTER TABLE help_articles DROP COLUMN IF EXISTS org_id;
ALTER TABLE help_categories DROP COLUMN IF EXISTS org_id;
ALTER TABLE knowledge_sources DROP COLUMN IF EXISTS org_id;
ALTER TABLE leads DROP COLUMN IF EXISTS org_id;
ALTER TABLE scheduled_reports DROP COLUMN IF EXISTS org_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS org_id;
ALTER TABLE usage_metrics DROP COLUMN IF EXISTS org_id;
ALTER TABLE webhooks DROP COLUMN IF EXISTS org_id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);