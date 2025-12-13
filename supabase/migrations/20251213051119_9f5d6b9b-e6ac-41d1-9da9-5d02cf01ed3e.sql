-- Add unique constraint for WordPress community upsert
-- This allows us to upsert locations based on agent_id + wordpress_community_id
CREATE UNIQUE INDEX IF NOT EXISTS locations_agent_wordpress_community_unique 
ON locations (agent_id, wordpress_community_id) 
WHERE wordpress_community_id IS NOT NULL;