/**
 * Embedding Generation & Caching
 * Generate and cache embeddings for RAG and semantic search.
 * 
 * @module _shared/ai/embeddings
 * @description Uses OpenRouter for embedding generation with caching.
 * 
 * @example
 * ```typescript
 * import { generateEmbedding, getCachedEmbedding, cacheQueryEmbedding } from "../_shared/ai/embeddings.ts";
 * 
 * const queryHash = await hashQuery(query);
 * let embedding = await getCachedEmbedding(supabase, queryHash, agentId);
 * if (!embedding) {
 *   embedding = await generateEmbedding(query);
 *   await cacheQueryEmbedding(supabase, queryHash, query, embedding, agentId);
 * }
 * ```
 */

import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from './config.ts';

// ============================================
// EMBEDDING GENERATION
// ============================================

/**
 * Generate embedding using Qwen3 via OpenRouter (consolidated billing)
 * 
 * @param query - Text to embed
 * @returns Embedding vector (1024 dimensions, truncated from 4096 via MRL)
 * @throws Error if OPENROUTER_API_KEY not configured or API fails
 */
export async function generateEmbedding(query: string): Promise<number[]> {
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://getpilot.io',
      'X-Title': 'Pilot',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Embedding generation error:', error);
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  const fullEmbedding = data.data[0].embedding;
  
  // Qwen3 returns 4096 dimensions - truncate to 1024 via Matryoshka (MRL)
  // This maintains quality while reducing storage and compute costs
  return fullEmbedding.slice(0, EMBEDDING_DIMENSIONS);
}

// ============================================
// EMBEDDING CACHING
// ============================================

/**
 * Check query embedding cache
 * 
 * @param supabase - Supabase client
 * @param queryHash - Hash of the normalized query
 * @param agentId - Agent UUID
 * @returns Cached embedding or null if not found
 */
export async function getCachedEmbedding(
  supabase: any,
  queryHash: string,
  agentId: string
): Promise<number[] | null> {
  const { data, error } = await supabase
    .from('query_embedding_cache')
    .select('embedding')
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .single();
  
  if (error || !data?.embedding) return null;
  
  // Update hit count and last used (fire-and-forget)
  supabase
    .from('query_embedding_cache')
    .update({ hit_count: supabase.rpc('increment', { x: 1 }), last_used_at: new Date().toISOString() })
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .then(() => {})
    .catch(() => {});
  
  // Parse embedding string to array - handles scientific notation properly
  try {
    const embeddingStr = data.embedding as string;
    // Remove brackets and split by comma - handles scientific notation like 1.23e-05
    const cleaned = embeddingStr.replace(/^\[|\]$/g, '');
    const values = cleaned.split(',').map(v => parseFloat(v.trim()));
    
    // Validate we got the expected dimensions
    if (values.length !== EMBEDDING_DIMENSIONS) {
      console.error(`Cached embedding has wrong dimensions: ${values.length}, expected ${EMBEDDING_DIMENSIONS}`);
      return null;
    }
    
    console.log(`Embedding CACHE HIT - retrieved ${values.length} dimensions`);
    return values;
  } catch {
    return null;
  }
}

/**
 * Cache query embedding with 7-day TTL
 * 
 * @param supabase - Supabase client
 * @param queryHash - Hash of the normalized query
 * @param normalized - Normalized query string
 * @param embedding - Embedding vector to cache
 * @param agentId - Agent UUID
 */
export async function cacheQueryEmbedding(
  supabase: any,
  queryHash: string,
  normalized: string,
  embedding: number[],
  agentId: string
): Promise<void> {
  try {
    const embeddingVector = `[${embedding.join(',')}]`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days TTL
    const { error } = await supabase
      .from('query_embedding_cache')
      .upsert({
        query_hash: queryHash,
        query_normalized: normalized,
        embedding: embeddingVector,
        agent_id: agentId,
        expires_at: expiresAt,
      }, { onConflict: 'query_hash' });
    
    if (error) {
      console.error('Failed to cache embedding:', error);
    }
  } catch (err) {
    console.error('Failed to cache embedding:', err);
  }
}
