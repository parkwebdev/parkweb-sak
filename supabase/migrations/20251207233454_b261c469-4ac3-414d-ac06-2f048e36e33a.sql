-- Migration: Switch from 768-dim Nomic embeddings to 1536-dim OpenAI embeddings

-- Drop existing functions that use vector type
DROP FUNCTION IF EXISTS search_help_articles(uuid, vector, double precision, integer);
DROP FUNCTION IF EXISTS search_knowledge_chunks(uuid, vector, double precision, integer);
DROP FUNCTION IF EXISTS search_knowledge_sources(uuid, vector, double precision, integer);

-- Alter embedding columns to new dimension (1536 for OpenAI text-embedding-3-small)
-- First set all existing embeddings to NULL since they're incompatible dimensions
UPDATE help_articles SET embedding = NULL;
UPDATE knowledge_chunks SET embedding = NULL;
UPDATE knowledge_sources SET embedding = NULL;
UPDATE query_embedding_cache SET embedding = NULL;

-- Drop and recreate columns with new vector size
ALTER TABLE help_articles DROP COLUMN IF EXISTS embedding;
ALTER TABLE help_articles ADD COLUMN embedding vector(1536);

ALTER TABLE knowledge_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(1536);

ALTER TABLE knowledge_sources DROP COLUMN IF EXISTS embedding;
ALTER TABLE knowledge_sources ADD COLUMN embedding vector(1536);

ALTER TABLE query_embedding_cache DROP COLUMN IF EXISTS embedding;
ALTER TABLE query_embedding_cache ADD COLUMN embedding vector(1536);

-- Recreate search function for help articles with 1536 dimensions
CREATE OR REPLACE FUNCTION search_help_articles(
  p_agent_id uuid,
  p_query_embedding vector(1536),
  p_match_threshold double precision DEFAULT 0.7,
  p_match_count integer DEFAULT 3
)
RETURNS TABLE(
  article_id uuid,
  title text,
  content text,
  category_name text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ha.id as article_id,
    ha.title,
    ha.content,
    hc.name as category_name,
    (1 - (ha.embedding <=> p_query_embedding))::FLOAT as similarity
  FROM help_articles ha
  LEFT JOIN help_categories hc ON hc.id = ha.category_id
  WHERE ha.agent_id = p_agent_id
    AND ha.embedding IS NOT NULL
    AND (1 - (ha.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY ha.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Recreate search function for knowledge chunks with 1536 dimensions
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  p_agent_id uuid,
  p_query_embedding vector(1536),
  p_match_threshold double precision DEFAULT 0.7,
  p_match_count integer DEFAULT 5
)
RETURNS TABLE(
  chunk_id uuid,
  source_id uuid,
  source_name text,
  source_type text,
  content text,
  chunk_index integer,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id as chunk_id,
    kc.source_id,
    ks.source as source_name,
    ks.type::text as source_type,
    kc.content,
    kc.chunk_index,
    (1 - (kc.embedding <=> p_query_embedding))::FLOAT as similarity
  FROM knowledge_chunks kc
  JOIN knowledge_sources ks ON ks.id = kc.source_id
  WHERE kc.agent_id = p_agent_id
    AND kc.embedding IS NOT NULL
    AND ks.status = 'ready'
    AND (1 - (kc.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY kc.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Recreate search function for knowledge sources with 1536 dimensions
CREATE OR REPLACE FUNCTION search_knowledge_sources(
  p_agent_id uuid,
  p_query_embedding vector(1536),
  p_match_threshold double precision DEFAULT 0.7,
  p_match_count integer DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  source text,
  content text,
  type text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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