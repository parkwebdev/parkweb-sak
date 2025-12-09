-- Vector index for knowledge_chunks embedding (primary RAG source)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
ON public.knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 20);