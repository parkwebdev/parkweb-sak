-- Properties table enhancements
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS lot_rent INTEGER,
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
  ADD COLUMN IF NOT EXISTS community_type TEXT;

-- Locations table enhancements  
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pet_policy TEXT,
  ADD COLUMN IF NOT EXISTS utilities_included JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS age_category TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Index for community type filtering
CREATE INDEX IF NOT EXISTS idx_properties_community_type 
  ON properties(community_type) 
  WHERE community_type IS NOT NULL;

-- Index for age category filtering
CREATE INDEX IF NOT EXISTS idx_locations_age_category 
  ON locations(age_category) 
  WHERE age_category IS NOT NULL;