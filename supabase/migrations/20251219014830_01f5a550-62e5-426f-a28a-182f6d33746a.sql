-- Add has_viewed_installation column to agents table
ALTER TABLE agents ADD COLUMN has_viewed_installation boolean DEFAULT false;