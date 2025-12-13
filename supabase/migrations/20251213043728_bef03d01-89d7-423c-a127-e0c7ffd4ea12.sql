-- Add WordPress integration columns to locations table
ALTER TABLE public.locations 
  ADD COLUMN IF NOT EXISTS wordpress_slug TEXT,
  ADD COLUMN IF NOT EXISTS wordpress_community_id INTEGER;

-- Add unique constraint for WordPress sync matching (prevents duplicates during sync)
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_wordpress_community 
  ON public.locations(agent_id, wordpress_community_id) 
  WHERE wordpress_community_id IS NOT NULL;

-- Add index for wordpress_slug lookups (used by widget detection)
CREATE INDEX IF NOT EXISTS idx_locations_wordpress_slug 
  ON public.locations(agent_id, wordpress_slug) 
  WHERE wordpress_slug IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.locations.wordpress_slug IS 'WordPress community post slug for URL-based location detection';
COMMENT ON COLUMN public.locations.wordpress_community_id IS 'WordPress community post ID for sync matching';