-- Phase 1: Add pgvector extension and embedding column for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge_sources for semantic search
ALTER TABLE knowledge_sources 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for efficient similarity search
CREATE INDEX IF NOT EXISTS knowledge_sources_embedding_idx 
ON knowledge_sources USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Phase 2: Create search_knowledge_sources function for RAG
CREATE OR REPLACE FUNCTION search_knowledge_sources(
  p_agent_id uuid,
  p_query_embedding vector(1536),
  p_match_threshold float DEFAULT 0.7,
  p_match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source text,
  content text,
  type text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ks.id,
    ks.source,
    ks.content,
    ks.type::text,
    1 - (ks.embedding <=> p_query_embedding) as similarity
  FROM knowledge_sources ks
  WHERE ks.agent_id = p_agent_id
    AND ks.status = 'ready'
    AND ks.embedding IS NOT NULL
    AND 1 - (ks.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY ks.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Phase 3: Add unique constraint to usage_metrics for proper upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'usage_metrics_user_period_unique'
  ) THEN
    ALTER TABLE usage_metrics 
    ADD CONSTRAINT usage_metrics_user_period_unique 
    UNIQUE (user_id, period_start);
  END IF;
END $$;

-- Phase 4: Standardize plan limits to include all fields
-- Update Free plan
UPDATE plans 
SET limits = jsonb_set(
  jsonb_set(
    COALESCE(limits, '{}'::jsonb),
    '{max_team_members}',
    '1'
  ),
  '{max_webhooks}',
  '0'
)
WHERE name = 'Free';

-- Update Basic plan
UPDATE plans 
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{max_team_members}',
  '3'
)
WHERE name = 'Basic' AND NOT (limits ? 'max_team_members');

-- Update Advanced plan  
UPDATE plans 
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{max_team_members}',
  '5'
)
WHERE name = 'Advanced' AND NOT (limits ? 'max_team_members');

-- Update Pro plan
UPDATE plans 
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{max_webhooks}',
  '10'
)
WHERE name = 'Pro' AND NOT (limits ? 'max_webhooks');

-- Update Business plan
UPDATE plans 
SET limits = jsonb_set(
  COALESCE(limits, '{}'::jsonb),
  '{max_webhooks}',
  '50'
)
WHERE name = 'Business' AND NOT (limits ? 'max_webhooks');