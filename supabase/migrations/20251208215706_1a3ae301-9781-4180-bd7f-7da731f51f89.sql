-- Phase 1: Update vector dimensions from 1536 to 1024 for Qwen3 embeddings
-- This requires clearing existing embeddings first, then altering columns

-- Step 1: Clear all existing embeddings (they'll be regenerated with Qwen3)
UPDATE knowledge_chunks SET embedding = NULL;
UPDATE help_articles SET embedding = NULL;
UPDATE knowledge_sources SET embedding = NULL;

-- Step 2: Clear embedding caches (they're 1536-dimensional)
DELETE FROM query_embedding_cache;
DELETE FROM response_cache;

-- Step 3: Alter vector columns to new dimension
-- Drop and recreate the columns with new dimension (PostgreSQL doesn't allow direct dimension change)
ALTER TABLE knowledge_chunks 
  ALTER COLUMN embedding TYPE vector(1024) USING NULL;

ALTER TABLE help_articles 
  ALTER COLUMN embedding TYPE vector(1024) USING NULL;

ALTER TABLE knowledge_sources 
  ALTER COLUMN embedding TYPE vector(1024) USING NULL;

ALTER TABLE query_embedding_cache 
  ALTER COLUMN embedding TYPE vector(1024) USING NULL;

-- Step 4: Mark all knowledge sources as pending so they get re-processed
UPDATE knowledge_sources 
SET status = 'pending', 
    updated_at = now(),
    metadata = metadata || '{"migration_reason": "switched_to_qwen3_1024d"}'::jsonb
WHERE status = 'ready';

-- Step 5: Update search functions to use new dimensions (already dimension-agnostic via vector type)
-- The RPC functions don't need changes as they accept vector parameters

COMMENT ON COLUMN knowledge_chunks.embedding IS 'Qwen3 embedding vector (1024 dimensions via OpenRouter)';
COMMENT ON COLUMN help_articles.embedding IS 'Qwen3 embedding vector (1024 dimensions via OpenRouter)';
COMMENT ON COLUMN knowledge_sources.embedding IS 'Qwen3 embedding vector (1024 dimensions via OpenRouter)';
COMMENT ON COLUMN query_embedding_cache.embedding IS 'Qwen3 query embedding cache (1024 dimensions via OpenRouter)';