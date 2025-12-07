-- Add enable_news_tab column to track if news tab is enabled in widget
ALTER TABLE agents ADD COLUMN IF NOT EXISTS enable_news_tab boolean DEFAULT false;