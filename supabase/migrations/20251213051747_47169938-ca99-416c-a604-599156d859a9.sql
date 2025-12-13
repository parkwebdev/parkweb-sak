-- Add wordpress_home to knowledge_source_type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'wordpress_home' AND enumtypid = 'knowledge_source_type'::regtype) THEN
    ALTER TYPE knowledge_source_type ADD VALUE 'wordpress_home';
  END IF;
END $$;

-- Add unique constraint on properties for WordPress home upserts
-- Using external_id + knowledge_source_id for uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS properties_source_external_unique 
ON properties (knowledge_source_id, external_id) 
WHERE external_id IS NOT NULL;