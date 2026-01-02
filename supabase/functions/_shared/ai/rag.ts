/**
 * RAG (Retrieval Augmented Generation) Module
 * Knowledge search and response caching for AI responses.
 * 
 * @module _shared/ai/rag
 * @description Searches knowledge chunks, sources, and help articles.
 * 
 * @example
 * ```typescript
 * import { searchKnowledge, getCachedResponse, cacheResponse } from "../_shared/ai/rag.ts";
 * 
 * const knowledge = await searchKnowledge(supabase, agentId, embedding);
 * const cached = await getCachedResponse(supabase, queryHash, agentId);
 * ```
 */

import { MAX_RAG_CHUNKS } from './config.ts';

// ============================================
// TYPES
// ============================================

export interface KnowledgeResult {
  content: string;
  source: string;
  type: string;
  similarity: number;
  chunkIndex?: number;
  sourceUrl?: string;
}

// ============================================
// KNOWLEDGE SEARCH
// ============================================

/**
 * Search for relevant knowledge chunks (with fallback to legacy document search)
 * 
 * @param supabase - Supabase client
 * @param agentId - Agent UUID
 * @param queryEmbedding - Query embedding vector
 * @param matchThreshold - Minimum similarity threshold (default: 0.7)
 * @param matchCount - Maximum results to return (default: 5)
 * @returns Array of knowledge results sorted by similarity
 */
export async function searchKnowledge(
  supabase: any,
  agentId: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<KnowledgeResult[]> {
  const embeddingVector = `[${queryEmbedding.join(',')}]`;
  const results: KnowledgeResult[] = [];

  // Try new chunk-level search first
  const { data: chunkData, error: chunkError } = await supabase.rpc('search_knowledge_chunks', {
    p_agent_id: agentId,
    p_query_embedding: embeddingVector,
    p_match_threshold: matchThreshold,
    p_match_count: matchCount,
  });

  if (!chunkError && chunkData && chunkData.length > 0) {
    console.log(`Found ${chunkData.length} relevant chunks via chunk-level search`);
    
    // Get source URLs for the chunks
    const sourceIds = [...new Set(chunkData.map((c: any) => c.source_id))];
    const { data: sourceData } = await supabase
      .from('knowledge_sources')
      .select('id, source, type')
      .in('id', sourceIds);
    
    const sourceMap = new Map(sourceData?.map((s: any) => [s.id, s]) || []);
    
    results.push(...chunkData.map((chunk: any) => {
      const sourceInfo = sourceMap.get(chunk.source_id);
      // Include the source URL for URL-type sources
      const sourceUrl = sourceInfo?.type === 'url' ? sourceInfo.source : undefined;
      return {
        content: chunk.content,
        source: chunk.source_name,
        type: chunk.source_type,
        similarity: chunk.similarity,
        chunkIndex: chunk.chunk_index,
        sourceUrl,
      };
    }));
  } else {
    // Fallback to legacy document-level search for backwards compatibility
    console.log('Falling back to document-level search');
    const { data, error } = await supabase.rpc('search_knowledge_sources', {
      p_agent_id: agentId,
      p_query_embedding: embeddingVector,
      p_match_threshold: matchThreshold,
      p_match_count: matchCount,
    });

    if (!error && data) {
      results.push(...data.map((d: any) => ({
        content: d.content,
        source: d.source,
        type: d.type,
        similarity: d.similarity,
        // For URL sources, the source IS the URL
        sourceUrl: d.type === 'url' ? d.source : undefined,
      })));
    }
  }

  // Also search Help Articles for RAG
  try {
    console.log(`Searching help articles with threshold: ${matchThreshold}`);
    const { data: helpArticles, error: helpError } = await supabase.rpc('search_help_articles', {
      p_agent_id: agentId,
      p_query_embedding: embeddingVector,
      p_match_threshold: matchThreshold,
      p_match_count: MAX_RAG_CHUNKS,
    });

    if (helpError) {
      console.error('Help article search RPC error:', helpError);
    } else if (!helpArticles || helpArticles.length === 0) {
      console.log('No help articles found above threshold');
    } else {
      console.log(`Found ${helpArticles.length} relevant help articles:`, 
        helpArticles.map((a: any) => ({ title: a.title, similarity: a.similarity?.toFixed(3) })));
      results.push(...helpArticles.map((article: any) => ({
        content: article.content,
        source: `Help: ${article.title}${article.category_name ? ` (${article.category_name})` : ''}`,
        type: 'help_article',
        similarity: article.similarity,
      })));
    }
  } catch (helpSearchError) {
    console.error('Help article search error (continuing without):', helpSearchError);
  }

  // Sort combined results by similarity and return top MAX_RAG_CHUNKS
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_RAG_CHUNKS);
}

// ============================================
// RESPONSE CACHING
// ============================================

/**
 * Check response cache for high-confidence cached responses
 * 
 * @param supabase - Supabase client
 * @param queryHash - Hash of the normalized query
 * @param agentId - Agent UUID
 * @returns Cached response or null
 */
export async function getCachedResponse(
  supabase: any,
  queryHash: string,
  agentId: string
): Promise<{ content: string; similarity: number } | null> {
  const { data, error } = await supabase
    .from('response_cache')
    .select('response_content, similarity_score')
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) return null;
  
  // Update hit count (fire-and-forget)
  supabase
    .from('response_cache')
    .update({ hit_count: supabase.rpc('increment', { x: 1 }), last_used_at: new Date().toISOString() })
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .then(() => {})
    .catch(() => {});
  
  console.log('Cache HIT for response, similarity:', data.similarity_score);
  return { content: data.response_content, similarity: data.similarity_score };
}

/**
 * Cache high-confidence response (aggressive caching with lowered threshold)
 * 
 * @param supabase - Supabase client
 * @param queryHash - Hash of the normalized query
 * @param agentId - Agent UUID
 * @param content - Response content to cache
 * @param similarity - Similarity score of the response
 */
export async function cacheResponse(
  supabase: any,
  queryHash: string,
  agentId: string,
  content: string,
  similarity: number
): Promise<void> {
  try {
    // Cache responses with moderate+ similarity (threshold lowered for cost optimization)
    if (similarity < 0.60) return;
    
    const { error } = await supabase
      .from('response_cache')
      .upsert({
        query_hash: queryHash,
        agent_id: agentId,
        response_content: content,
        similarity_score: similarity,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      }, { onConflict: 'query_hash,agent_id' });
    
    if (error) {
      console.error('Failed to cache response:', error);
    }
  } catch (err) {
    console.error('Failed to cache response:', err);
  }
}
