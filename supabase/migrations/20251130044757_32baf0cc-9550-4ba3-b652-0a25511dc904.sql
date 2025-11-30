-- Add RLS policies for announcements table to allow authenticated users to manage their own announcements

-- Allow users to insert announcements for their own agents
CREATE POLICY "Users can insert their own announcements"
ON announcements FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM agents WHERE agents.id = announcements.agent_id AND agents.user_id = auth.uid()
  )
);

-- Allow users to update their own announcements
CREATE POLICY "Users can update their own announcements"
ON announcements FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to delete their own announcements
CREATE POLICY "Users can delete their own announcements"
ON announcements FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to view all their own announcements (not just active ones)
CREATE POLICY "Users can view their own announcements"
ON announcements FOR SELECT
USING (auth.uid() = user_id);