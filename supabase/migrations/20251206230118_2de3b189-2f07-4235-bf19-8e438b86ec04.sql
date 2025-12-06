-- Enable REPLICA IDENTITY FULL for complete row data in updates
ALTER TABLE announcements REPLICA IDENTITY FULL;
ALTER TABLE help_categories REPLICA IDENTITY FULL;
ALTER TABLE help_articles REPLICA IDENTITY FULL;
ALTER TABLE agents REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE help_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE help_articles;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;