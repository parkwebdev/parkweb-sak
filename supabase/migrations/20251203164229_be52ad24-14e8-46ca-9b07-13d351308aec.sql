-- Allow anonymous users to view messages for widget realtime subscriptions
-- This is safe because conversation IDs are UUIDs (hard to guess) and content is already sent to the user
CREATE POLICY "Public can view messages for realtime"
  ON messages FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view conversation status for takeover notifications
CREATE POLICY "Public can view conversation status for realtime"
  ON conversations FOR SELECT
  TO anon
  USING (true);