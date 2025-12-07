-- Query embedding cache table for reducing redundant embedding API calls
CREATE TABLE IF NOT EXISTS query_embedding_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL UNIQUE,
  query_normalized TEXT NOT NULL,
  embedding vector(768),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  hit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast hash lookups
CREATE INDEX query_embedding_cache_hash_idx ON query_embedding_cache(query_hash);
CREATE INDEX query_embedding_cache_agent_idx ON query_embedding_cache(agent_id);

-- Response cache for high-confidence FAQ-style answers
CREATE TABLE IF NOT EXISTS response_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  response_content TEXT NOT NULL,
  similarity_score FLOAT NOT NULL,
  hit_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  UNIQUE(query_hash, agent_id)
);

CREATE INDEX response_cache_lookup_idx ON response_cache(query_hash, agent_id);
CREATE INDEX response_cache_expires_idx ON response_cache(expires_at);

-- RLS policies for caches (service role only)
ALTER TABLE query_embedding_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage query cache" ON query_embedding_cache FOR ALL USING (true);
CREATE POLICY "Service role can manage response cache" ON response_cache FOR ALL USING (true);

-- Cleanup function for expired cache entries (can be called by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_caches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete expired response cache entries
  DELETE FROM response_cache WHERE expires_at < now();
  
  -- Delete query embeddings not used in 30 days
  DELETE FROM query_embedding_cache WHERE last_used_at < now() - interval '30 days';
END;
$$;