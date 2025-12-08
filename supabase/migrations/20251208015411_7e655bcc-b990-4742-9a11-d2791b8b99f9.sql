-- Fix stuck knowledge source that's been processing for 2+ hours
UPDATE knowledge_sources 
SET status = 'error', 
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', '"Processing timeout - please delete and re-add this source"')
WHERE id = '2d313ecc-3110-40dd-8b83-56110d58459a' 
  AND status = 'processing';