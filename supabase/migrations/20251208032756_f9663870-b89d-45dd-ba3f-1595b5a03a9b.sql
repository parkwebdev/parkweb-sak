-- Fix stuck processing record by marking it as error
UPDATE knowledge_sources 
SET 
  status = 'error',
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb), 
    '{error}', 
    '"Processing timed out - marked for retry"'
  ),
  updated_at = now()
WHERE id = '36060d82-2e05-4052-b48e-155fcfb1a106'
  AND status = 'processing';