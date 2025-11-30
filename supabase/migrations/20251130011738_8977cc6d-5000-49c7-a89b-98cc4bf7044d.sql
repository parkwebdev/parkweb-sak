-- Step 1: Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  member_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, member_id),
  CHECK (owner_id != member_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their team" ON team_members FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Members can view their membership" ON team_members FOR SELECT USING (auth.uid() = member_id);

-- Step 2: Add user_id columns to all tables
ALTER TABLE agents ADD COLUMN user_id UUID;
ALTER TABLE announcements ADD COLUMN user_id UUID;
ALTER TABLE api_keys ADD COLUMN user_id UUID;
ALTER TABLE conversations ADD COLUMN user_id UUID;
ALTER TABLE custom_domains ADD COLUMN user_id UUID;
ALTER TABLE help_articles ADD COLUMN user_id UUID;
ALTER TABLE help_categories ADD COLUMN user_id UUID;
ALTER TABLE knowledge_sources ADD COLUMN user_id UUID;
ALTER TABLE leads ADD COLUMN user_id UUID;
ALTER TABLE scheduled_reports ADD COLUMN user_id UUID;
ALTER TABLE subscriptions ADD COLUMN user_id UUID;
ALTER TABLE usage_metrics ADD COLUMN user_id UUID;
ALTER TABLE webhooks ADD COLUMN user_id UUID;

-- Step 3: Migrate data (populate user_id from org_members where role = owner)
UPDATE agents SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = agents.org_id AND om.role = 'owner' LIMIT 1);
UPDATE announcements SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = announcements.org_id AND om.role = 'owner' LIMIT 1);
UPDATE api_keys SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = api_keys.org_id AND om.role = 'owner' LIMIT 1);
UPDATE conversations SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = conversations.org_id AND om.role = 'owner' LIMIT 1);
UPDATE custom_domains SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = custom_domains.org_id AND om.role = 'owner' LIMIT 1);
UPDATE help_articles SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = help_articles.org_id AND om.role = 'owner' LIMIT 1);
UPDATE help_categories SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = help_categories.org_id AND om.role = 'owner' LIMIT 1);
UPDATE knowledge_sources SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = knowledge_sources.org_id AND om.role = 'owner' LIMIT 1);
UPDATE leads SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = leads.org_id AND om.role = 'owner' LIMIT 1);
UPDATE scheduled_reports SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = scheduled_reports.org_id AND om.role = 'owner' LIMIT 1);
UPDATE subscriptions SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = subscriptions.org_id AND om.role = 'owner' LIMIT 1);
UPDATE usage_metrics SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = usage_metrics.org_id AND om.role = 'owner' LIMIT 1);
UPDATE webhooks SET user_id = (SELECT om.user_id FROM org_members om WHERE om.org_id = webhooks.org_id AND om.role = 'owner' LIMIT 1);

-- Step 4: Migrate team members to team_members table
INSERT INTO team_members (owner_id, member_id, role)
SELECT 
  owner_members.user_id,
  non_owner_members.user_id,
  CASE WHEN non_owner_members.role = 'admin' THEN 'admin' ELSE 'member' END
FROM org_members owner_members
JOIN org_members non_owner_members ON owner_members.org_id = non_owner_members.org_id
WHERE owner_members.role = 'owner' AND non_owner_members.role != 'owner'
ON CONFLICT DO NOTHING;

-- Step 5: Make user_id NOT NULL
ALTER TABLE agents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE announcements ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE api_keys ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE custom_domains ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE help_articles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE help_categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE knowledge_sources ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE leads ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE scheduled_reports ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE usage_metrics ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE webhooks ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Drop old tables with CASCADE (this will drop dependent policies and constraints)
DROP TABLE IF EXISTS org_branding CASCADE;
DROP TABLE IF EXISTS org_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Step 7: Drop old functions with CASCADE
DROP FUNCTION IF EXISTS is_org_member(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_org_admin(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_org_role(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS auto_generate_org_slug() CASCADE;
DROP FUNCTION IF EXISTS validate_org_slug_update() CASCADE;

-- Step 8: Create new helper functions
CREATE FUNCTION has_account_access(account_owner_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT auth.uid() = account_owner_id OR EXISTS (SELECT 1 FROM team_members WHERE owner_id = account_owner_id AND member_id = auth.uid()) $$;

CREATE FUNCTION get_account_owner_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT CASE WHEN EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid()) THEN auth.uid() ELSE (SELECT owner_id FROM team_members WHERE member_id = auth.uid() LIMIT 1) END $$;

CREATE FUNCTION is_account_admin(account_owner_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT auth.uid() = account_owner_id OR EXISTS (SELECT 1 FROM team_members WHERE owner_id = account_owner_id AND member_id = auth.uid() AND role = 'admin') $$;