-- Restore parent_source_id for orphaned sitemap child sources
UPDATE knowledge_sources 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{parent_source_id}',
  '"29624725-d10c-4a29-bb86-dd2b36198bad"'
)
WHERE agent_id = '25b7bed8-3071-4630-8c22-d6f14a6b2671'
  AND source LIKE 'https://broadview.parkweb.dev/%'
  AND id != '29624725-d10c-4a29-bb86-dd2b36198bad'
  AND (metadata->>'is_sitemap' IS NULL OR metadata->>'is_sitemap' != 'true')
  AND (metadata->>'parent_source_id' IS NULL);