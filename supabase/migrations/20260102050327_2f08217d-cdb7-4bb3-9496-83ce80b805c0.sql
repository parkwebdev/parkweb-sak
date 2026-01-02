-- Add content_hash column to locations table for change detection during WordPress sync
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS content_hash text;

-- Add content_hash column to properties table for change detection during WordPress sync
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS content_hash text;

-- Add index for faster lookups during sync
CREATE INDEX IF NOT EXISTS idx_locations_wp_community_id ON locations(agent_id, wordpress_community_id) WHERE wordpress_community_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_external_id ON properties(agent_id, external_id) WHERE external_id IS NOT NULL;