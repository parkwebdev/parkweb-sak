-- Function to generate a unique slug from a name
CREATE OR REPLACE FUNCTION generate_unique_slug(org_name text, org_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Generate base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(trim(org_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'org';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (
    SELECT 1 FROM organizations 
    WHERE slug = final_slug 
    AND (org_id IS NULL OR id != org_id)
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to auto-generate slug on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_org_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If slug is not provided or is empty, generate one
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(NEW.name);
  ELSE
    -- If slug is provided, validate it's unique
    IF EXISTS (
      SELECT 1 FROM organizations 
      WHERE slug = NEW.slug AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Organization slug "%" already exists', NEW.slug;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to validate slug on update
CREATE OR REPLACE FUNCTION validate_org_slug_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If slug is being changed, validate it's unique
  IF NEW.slug != OLD.slug THEN
    IF EXISTS (
      SELECT 1 FROM organizations 
      WHERE slug = NEW.slug AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Organization slug "%" already exists', NEW.slug;
    END IF;
    
    -- Validate slug format (lowercase alphanumeric and hyphens only)
    IF NOT (NEW.slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$') THEN
      RAISE EXCEPTION 'Invalid slug format. Use only lowercase letters, numbers, and hyphens';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_auto_generate_org_slug ON organizations;
CREATE TRIGGER trigger_auto_generate_org_slug
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_org_slug();

DROP TRIGGER IF EXISTS trigger_validate_org_slug_update ON organizations;
CREATE TRIGGER trigger_validate_org_slug_update
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION validate_org_slug_update();

-- Add unique constraint on slug if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_slug_key'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Update any existing organizations without slugs
UPDATE organizations
SET slug = generate_unique_slug(name, id)
WHERE slug IS NULL OR slug = '';