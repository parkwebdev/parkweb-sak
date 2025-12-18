-- Reactivate WordPress-synced locations that were previously soft-deleted
-- These locations came from WordPress sync but were marked is_active = false by older code
UPDATE public.locations 
SET is_active = true, updated_at = now()
WHERE wordpress_community_id IS NOT NULL 
  AND is_active = false;