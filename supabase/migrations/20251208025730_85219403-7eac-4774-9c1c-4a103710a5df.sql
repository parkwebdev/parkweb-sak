-- Restore urls_found for the sitemap by counting its child sources
UPDATE knowledge_sources 
SET metadata = jsonb_set(
  metadata,
  '{urls_found}',
  (
    SELECT to_jsonb(count(*))
    FROM knowledge_sources child
    WHERE (child.metadata->>'parent_source_id')::uuid = '29624725-d10c-4a29-bb86-dd2b36198bad'
  )
)
WHERE id = '29624725-d10c-4a29-bb86-dd2b36198bad';