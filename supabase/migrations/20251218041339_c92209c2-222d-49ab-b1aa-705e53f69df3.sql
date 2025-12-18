-- Drop 3 remaining duplicate indexes (unique constraints already cover these)
DROP INDEX IF EXISTS idx_agents_user;
DROP INDEX IF EXISTS query_embedding_cache_hash_idx;
DROP INDEX IF EXISTS response_cache_lookup_idx;