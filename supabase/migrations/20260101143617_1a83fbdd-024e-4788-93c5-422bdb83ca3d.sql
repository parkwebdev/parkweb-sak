-- Fix INSERT policies for help_articles, help_categories, and lead_stages
-- to allow team members to create these resources

-- Drop old INSERT policy for help_articles that only allowed owner
DROP POLICY IF EXISTS "Users can create articles for their agents" ON help_articles;

-- Create team-aware INSERT policy for help_articles
CREATE POLICY "Users can create articles for accessible agents"
ON help_articles FOR INSERT
WITH CHECK (
  has_account_access(user_id) AND
  EXISTS (SELECT 1 FROM agents WHERE agents.id = help_articles.agent_id AND has_account_access(agents.user_id))
);

-- Drop old INSERT policy for help_categories that only allowed owner
DROP POLICY IF EXISTS "Users can create categories for their agents" ON help_categories;

-- Create team-aware INSERT policy for help_categories
CREATE POLICY "Users can create categories for accessible agents"
ON help_categories FOR INSERT
WITH CHECK (
  has_account_access(user_id) AND
  EXISTS (SELECT 1 FROM agents WHERE agents.id = help_categories.agent_id AND has_account_access(agents.user_id))
);

-- Drop old INSERT policy for lead_stages that only allowed owner
DROP POLICY IF EXISTS "Users can create their own lead stages" ON lead_stages;

-- Create team-aware INSERT policy for lead_stages
CREATE POLICY "Users can create lead stages for accessible accounts"
ON lead_stages FOR INSERT
WITH CHECK (has_account_access(user_id));