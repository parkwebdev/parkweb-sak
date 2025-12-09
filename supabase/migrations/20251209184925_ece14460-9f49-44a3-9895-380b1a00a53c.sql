-- Vector index for help_articles embedding
CREATE INDEX IF NOT EXISTS idx_help_articles_embedding 
ON public.help_articles 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);

-- Vector index for knowledge_sources embedding
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_embedding 
ON public.knowledge_sources 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);

-- Vector index for query_embedding_cache
CREATE INDEX IF NOT EXISTS idx_query_embedding_cache_embedding 
ON public.query_embedding_cache 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);