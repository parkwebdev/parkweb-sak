-- Mark the stuck knowledge source as error so user can delete/reprocess it
UPDATE public.knowledge_sources 
SET status = 'error', 
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', '"Processing failed - edge function deployment issue"')
WHERE id = '5769e5e1-d40d-4ee7-ac8a-434fd9a1a67d' 
  AND status = 'processing';

-- Enable realtime for knowledge_sources table
ALTER PUBLICATION supabase_realtime ADD TABLE knowledge_sources;