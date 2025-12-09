-- Add expires_at column to query_embedding_cache for TTL support
ALTER TABLE public.query_embedding_cache 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days');

-- Update existing entries with 7-day expiration from now
UPDATE public.query_embedding_cache 
SET expires_at = now() + interval '7 days' 
WHERE expires_at IS NULL;

-- Update cleanup function to also clean expired query embeddings
CREATE OR REPLACE FUNCTION public.cleanup_expired_caches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete expired response cache entries
  DELETE FROM response_cache WHERE expires_at < now();
  
  -- Delete expired query embeddings (new TTL-based cleanup)
  DELETE FROM query_embedding_cache WHERE expires_at < now();
  
  -- Delete query embeddings not used in 30 days (fallback for entries without expires_at)
  DELETE FROM query_embedding_cache WHERE last_used_at < now() - interval '30 days' AND expires_at IS NULL;
END;
$function$;

-- Update search_knowledge_chunks to use IVFFlat probes for better recall
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(
  p_agent_id uuid, 
  p_query_embedding vector, 
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
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Set IVFFlat probes for better recall with vector indexes
  SET LOCAL ivfflat.probes = 10;
  
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
$function$;

-- Update search_help_articles to use IVFFlat probes for better recall
CREATE OR REPLACE FUNCTION public.search_help_articles(
  p_agent_id uuid, 
  p_query_embedding vector, 
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
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Set IVFFlat probes for better recall with vector indexes
  SET LOCAL ivfflat.probes = 10;
  
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
$function$;

-- Update search_knowledge_sources to use IVFFlat probes for better recall
CREATE OR REPLACE FUNCTION public.search_knowledge_sources(
  p_agent_id uuid, 
  p_query_embedding vector, 
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
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Set IVFFlat probes for better recall with vector indexes
  SET LOCAL ivfflat.probes = 10;
  
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
$function$;