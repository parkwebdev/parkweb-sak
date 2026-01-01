-- Drop old user-only policies for announcements
DROP POLICY IF EXISTS "Users can view their own announcements" ON announcements;
DROP POLICY IF EXISTS "Users can insert their own announcements" ON announcements;
DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Users can delete their own announcements" ON announcements;

-- Create team-aware policies for announcements
CREATE POLICY "Users can view accessible announcements"
ON announcements FOR SELECT
USING (has_account_access(user_id));

CREATE POLICY "Users can insert accessible announcements"
ON announcements FOR INSERT
WITH CHECK (
  has_account_access(user_id) AND
  EXISTS (SELECT 1 FROM agents WHERE agents.id = announcements.agent_id AND has_account_access(agents.user_id))
);

CREATE POLICY "Users can update accessible announcements"
ON announcements FOR UPDATE
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible announcements"
ON announcements FOR DELETE
USING (has_account_access(user_id));

-- Drop old user-only policies for news_items
DROP POLICY IF EXISTS "Users can view their own news items" ON news_items;
DROP POLICY IF EXISTS "Users can insert news items for their agents" ON news_items;
DROP POLICY IF EXISTS "Users can update their own news items" ON news_items;
DROP POLICY IF EXISTS "Users can delete their own news items" ON news_items;

-- Create team-aware policies for news_items
CREATE POLICY "Users can view accessible news items"
ON news_items FOR SELECT
USING (has_account_access(user_id));

CREATE POLICY "Users can insert accessible news items"
ON news_items FOR INSERT
WITH CHECK (
  has_account_access(user_id) AND
  EXISTS (SELECT 1 FROM agents WHERE agents.id = news_items.agent_id AND has_account_access(agents.user_id))
);

CREATE POLICY "Users can update accessible news items"
ON news_items FOR UPDATE
USING (has_account_access(user_id));

CREATE POLICY "Users can delete accessible news items"
ON news_items FOR DELETE
USING (has_account_access(user_id));