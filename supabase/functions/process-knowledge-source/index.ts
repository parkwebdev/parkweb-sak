import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Readability } from "npm:@mozilla/readability@0.5.0";
import { DOMParser } from "npm:linkedom@0.18.4";

// Local type for knowledge source metadata (edge functions can't import from src/)
interface KnowledgeSourceMetadata {
  is_sitemap?: boolean;
  parent_source_id?: string;
  batch_id?: string;
  urls_found?: number;
  exclude_patterns?: string[];
  include_patterns?: string[];
  page_limit?: number;
  chunks_count?: number;
  total_chunks?: number;
  content_length?: number;
  chunking_version?: number;
  embedding_model?: string;
  embedding_dimensions?: number;
  error?: string;
  processed_at?: string;
  last_progress_at?: string;
}

console.log('process-knowledge-source function initialized');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Qwen3 embedding model via OpenRouter (1024 dimensions - truncated from 4096 via MRL)
const EMBEDDING_MODEL = 'qwen/qwen3-embedding-8b';
const EMBEDDING_DIMENSIONS = 1024;

// Self-chaining configuration
const MAX_PROCESSING_TIME_MS = 60000; // 60 seconds max per invocation (safety margin for 150s limit)
const URLS_PER_BATCH = 5; // Process 5 URLs per invocation before self-chaining

// Track current batch context for beforeunload handler
let currentBatchContext: {
  parentSourceId: string;
  batchId: string;
  agentId: string;
} | null = null;

// Register beforeunload handler to detect forced shutdowns
addEventListener('beforeunload', (ev: any) => {
  console.log('Function shutdown due to:', ev.detail?.reason || 'unknown');
  
  // If we were processing a batch, it will be picked up by the stalled detection
  // or next cron job - we can't reliably trigger a new function from here
  if (currentBatchContext) {
    console.log('Shutdown during batch processing:', currentBatchContext.batchId);
    console.log('Batch will auto-resume on next check or cron job');
  }
});

// Improved chunking with semantic boundaries and overlap
function chunkText(text: string, maxTokens: number = 500, overlapTokens: number = 50): { content: string; tokenCount: number }[] {
  const chunks: { content: string; tokenCount: number }[] = [];
  
  // Rough token estimation: ~4 chars per token
  const charsPerToken = 4;
  const maxChars = maxTokens * charsPerToken;
  const overlapChars = overlapTokens * charsPerToken;
  
  // Split by paragraphs first (double newlines)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  let currentChunk = '';
  let currentTokens = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = Math.ceil(paragraph.length / charsPerToken);
    
    // If single paragraph is too large, split by sentences
    if (paragraphTokens > maxTokens) {
      // Save current chunk if exists
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          tokenCount: currentTokens
        });
        // Keep overlap from end of current chunk
        const overlapText = currentChunk.slice(-overlapChars);
        currentChunk = overlapText;
        currentTokens = Math.ceil(overlapText.length / charsPerToken);
      }
      
      // Split large paragraph by sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      
      for (const sentence of sentences) {
        const sentenceTokens = Math.ceil(sentence.length / charsPerToken);
        
        if (currentTokens + sentenceTokens > maxTokens && currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            tokenCount: currentTokens
          });
          // Keep overlap
          const overlapText = currentChunk.slice(-overlapChars);
          currentChunk = overlapText + sentence;
          currentTokens = Math.ceil(currentChunk.length / charsPerToken);
        } else {
          currentChunk += sentence;
          currentTokens += sentenceTokens;
        }
      }
    } else if (currentTokens + paragraphTokens > maxTokens) {
      // Current chunk is full, save it
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          tokenCount: currentTokens
        });
      }
      // Start new chunk with overlap + new paragraph
      const overlapText = currentChunk.slice(-overlapChars);
      currentChunk = overlapText + '\n\n' + paragraph;
      currentTokens = Math.ceil(currentChunk.length / charsPerToken);
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentTokens += paragraphTokens;
    }
  }
  
  // Save remaining chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      tokenCount: currentTokens
    });
  }
  
  return chunks;
}

// Generate embeddings using Qwen3 via OpenRouter (consolidated billing)
async function generateEmbedding(text: string): Promise<number[]> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://getpilot.app',
      'X-Title': 'Pilot',
    },
    body: JSON.stringify({
      input: text,
      model: EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding generation failed: ${error}`);
  }

  const data = await response.json();
  const fullEmbedding = data.data[0].embedding;
  
  // Qwen3 returns 4096 dimensions - truncate to 1024 via Matryoshka (MRL)
  return fullEmbedding.slice(0, EMBEDDING_DIMENSIONS);
}

// Batch generate embeddings with rate limiting
async function generateEmbeddingsBatch(
  chunks: { content: string; tokenCount: number }[],
  batchSize: number = 5,
  delayMs: number = 200
): Promise<(number[] | null)[]> {
  const embeddings: (number[] | null)[] = [];
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (chunk) => {
        try {
          return await generateEmbedding(chunk.content);
        } catch (error) {
          console.error(`Failed to generate embedding for chunk:`, error);
          return null;
        }
      })
    );
    
    embeddings.push(...batchResults);
    
    // Rate limiting delay between batches
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return embeddings;
}

// Check if URL is a sitemap
function isSitemapUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.xml') || 
         lowerUrl.includes('sitemap') ||
         lowerUrl.endsWith('/sitemap');
}

// Parse sitemap XML and extract all URLs
function parseSitemapXml(xml: string): string[] {
  const urls: string[] = [];
  
  // Extract URLs from <loc> tags
  const locMatches = xml.match(/<loc>(.*?)<\/loc>/gi) || [];
  for (const match of locMatches) {
    const url = match.replace(/<\/?loc>/gi, '').trim();
    if (url && url.startsWith('http')) {
      urls.push(url);
    }
  }
  
  return urls;
}

// Check if XML content is a sitemap index (contains other sitemaps)
function isSitemapIndex(xml: string): boolean {
  return xml.includes('<sitemapindex') || xml.includes('<sitemap>');
}

// Extract sitemap URLs from a sitemap index
function extractSitemapUrls(xml: string): string[] {
  const sitemapUrls: string[] = [];
  
  // Match <sitemap><loc>...</loc></sitemap> patterns
  const sitemapBlocks = xml.match(/<sitemap>[\s\S]*?<\/sitemap>/gi) || [];
  for (const block of sitemapBlocks) {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/i);
    if (locMatch && locMatch[1]) {
      sitemapUrls.push(locMatch[1].trim());
    }
  }
  
  return sitemapUrls;
}

// Process a single URL source (fetch, chunk, embed, store)
async function processUrlSource(
  supabase: any,
  sourceId: string,
  agentId: string,
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update status to processing
    await supabase
      .from('knowledge_sources')
      .update({ status: 'processing' })
      .eq('id', sourceId);

    // Fetch content
    const content = await fetchUrlContent(url);
    
    if (!content || content.length === 0) {
      throw new Error('No content to process');
    }

    // Update content
    await supabase
      .from('knowledge_sources')
      .update({ content })
      .eq('id', sourceId);

    // Delete existing chunks
    await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('source_id', sourceId);

    // Chunk and embed
    const chunks = chunkText(content, 500, 50);
    const embeddings = await generateEmbeddingsBatch(chunks, 5, 200);

    // Store chunks
    let successfulChunks = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      
      if (embedding) {
        const embeddingVector = `[${embedding.join(',')}]`;
        const { error: insertError } = await supabase
          .from('knowledge_chunks')
          .insert({
            source_id: sourceId,
            agent_id: agentId,
            chunk_index: i,
            content: chunk.content,
            embedding: embeddingVector,
            token_count: chunk.tokenCount,
            metadata: {
              original_length: chunk.content.length,
              embedding_model: EMBEDDING_MODEL,
            }
          });

        if (!insertError) {
          successfulChunks++;
        }
      }
    }

    // Fetch existing metadata to preserve parent_source_id, batch_id, etc.
    const { data: currentSource } = await supabase
      .from('knowledge_sources')
      .select('metadata')
      .eq('id', sourceId)
      .single();

    const existingMetadata: Record<string, unknown> = (currentSource?.metadata as Record<string, unknown>) || {};

    // Update source status to ready, preserving existing metadata
    await supabase
      .from('knowledge_sources')
      .update({
        status: 'ready',
        metadata: {
          ...existingMetadata,
          processed_at: new Date().toISOString(),
          chunks_count: successfulChunks,
          total_chunks: chunks.length,
          content_length: content.length,
          chunking_version: 2,
          embedding_model: EMBEDDING_MODEL,
          embedding_dimensions: EMBEDDING_DIMENSIONS,
        },
      })
      .eq('id', sourceId);

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Fetch existing metadata to preserve parent_source_id, batch_id, etc.
    const { data: currentSource } = await supabase
      .from('knowledge_sources')
      .select('metadata')
      .eq('id', sourceId)
      .single();

    const existingMetadata: Record<string, unknown> = (currentSource?.metadata as Record<string, unknown>) || {};

    // Update source status to error, preserving existing metadata
    await supabase
      .from('knowledge_sources')
      .update({
        status: 'error',
        metadata: {
          ...existingMetadata,
          error: errorMessage,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('id', sourceId);

    return { success: false, error: errorMessage };
  }
}

// Trigger next batch by calling this function again
async function triggerNextBatch(
  parentSourceId: string,
  batchId: string,
  agentId: string
): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for self-chain');
    return;
  }

  console.log('Triggering next batch (self-chaining)...');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-knowledge-source`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceId: parentSourceId,
        batchId,
        agentId,
        continue: true, // Flag indicating this is a continuation
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to trigger next batch:', response.status, errorText);
    } else {
      console.log('Next batch triggered successfully');
    }
  } catch (error) {
    console.error('Error triggering next batch:', error);
  }
}

// Helper function to sync urls_found with actual child count
async function syncUrlsFound(supabase: any, parentSourceId: string): Promise<number> {
  const { count } = await supabase
    .from('knowledge_sources')
    .select('id', { count: 'exact', head: true })
    .contains('metadata', { parent_source_id: parentSourceId });
  return count || 0;
}

// Mark stalled processing sources as errors (stuck for > 5 minutes)
async function markStalledSourcesAsError(
  supabase: any,
  batchId: string
): Promise<number> {
  const STALLED_THRESHOLD_MINUTES = 5;
  const cutoffTime = new Date(Date.now() - STALLED_THRESHOLD_MINUTES * 60 * 1000).toISOString();
  
  // Find sources that have been "processing" for too long
  const { data: stalledSources, error: fetchError } = await supabase
    .from('knowledge_sources')
    .select('id, source')
    .eq('status', 'processing')
    .contains('metadata', { batch_id: batchId })
    .lt('updated_at', cutoffTime);

  if (fetchError || !stalledSources || stalledSources.length === 0) {
    return 0;
  }

  console.log(`Found ${stalledSources.length} stalled sources, marking as error`);

  for (const source of stalledSources) {
    // Fetch existing metadata to preserve it
    const { data: currentSource } = await supabase
      .from('knowledge_sources')
      .select('metadata')
      .eq('id', source.id)
      .single();

    const existingMetadata: Record<string, unknown> = (currentSource?.metadata as Record<string, unknown>) || {};

    await supabase
      .from('knowledge_sources')
      .update({
        status: 'error',
        metadata: {
          ...existingMetadata,
          error: `Processing timed out after ${STALLED_THRESHOLD_MINUTES} minutes`,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('id', source.id);

    console.log(`Marked stalled source as error: ${source.source.substring(0, 60)}...`);
  }

  return stalledSources.length;
}

// Process pending child sources in small batches with self-chaining
async function processBatchAndContinue(
  supabase: any,
  parentSourceId: string,
  batchId: string,
  agentId: string
): Promise<void> {
  const startTime = Date.now();
  const DELAY_BETWEEN_URLS_MS = 1000; // 1 second delay between URLs

  console.log(`Processing batch for parent ${parentSourceId}, batch ${batchId}`);

  // Set batch context for beforeunload handler
  currentBatchContext = { parentSourceId, batchId, agentId };

  // First, check for and mark any stalled processing sources as errors
  const stalledCount = await markStalledSourcesAsError(supabase, batchId);
  if (stalledCount > 0) {
    console.log(`Recovered ${stalledCount} stalled sources by marking as error`);
  }

  // Fetch existing parent metadata
  const { data: parentSource } = await supabase
    .from('knowledge_sources')
    .select('metadata')
    .eq('id', parentSourceId)
    .single();

  let parentMetadata: Record<string, unknown> = (parentSource?.metadata as Record<string, unknown>) || {};

  let processed = 0;
  let errors = stalledCount; // Count stalled sources as errors
  let urlsProcessedThisBatch = 0;

  // Process URLs until time limit or batch limit reached
  while (true) {
    // Check time limit - stop well before edge function timeout
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_PROCESSING_TIME_MS) {
      console.log(`Time limit reached (${elapsed}ms), will continue in next invocation`);
      break;
    }

    // Check batch limit
    if (urlsProcessedThisBatch >= URLS_PER_BATCH) {
      console.log(`Batch limit reached (${urlsProcessedThisBatch} URLs), will continue in next invocation`);
      break;
    }

    // Get next pending source
    const { data: pendingSources, error: fetchError } = await supabase
      .from('knowledge_sources')
      .select('id, source, agent_id')
      .eq('status', 'pending')
      .contains('metadata', { batch_id: batchId })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching pending sources:', fetchError);
      break;
    }

    if (!pendingSources || pendingSources.length === 0) {
      // Check if there are still processing sources (not stalled yet)
      const { count: processingCount } = await supabase
        .from('knowledge_sources')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing')
        .contains('metadata', { batch_id: batchId });

      if (processingCount && processingCount > 0) {
        console.log(`No pending sources, but ${processingCount} still processing - will check again next batch`);
        break;
      }

      // All done!
      console.log('No more pending or processing sources - batch complete');
      
      // Sync urls_found and mark complete
      const finalChildCount = await syncUrlsFound(supabase, parentSourceId);
      
      // Get actual counts from database for accuracy
      const { count: readyCount } = await supabase
        .from('knowledge_sources')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ready')
        .contains('metadata', { parent_source_id: parentSourceId });

      const { count: errorCount } = await supabase
        .from('knowledge_sources')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'error')
        .contains('metadata', { parent_source_id: parentSourceId });

      const finalProcessedCount = readyCount || 0;
      const finalErrorCount = errorCount || 0;
      
      await supabase
        .from('knowledge_sources')
        .update({
          status: 'ready',
          content: `Sitemap processed. ${finalProcessedCount} pages indexed successfully${finalErrorCount > 0 ? `, ${finalErrorCount} failed` : ''}.`,
          metadata: {
            ...parentMetadata,
            is_sitemap: true,
            batch_id: batchId,
            urls_found: finalChildCount,
            processed_count: finalProcessedCount,
            error_count: finalErrorCount,
            remaining_count: 0,
            completed_at: new Date().toISOString(),
          },
        })
        .eq('id', parentSourceId);

      console.log(`Batch processing complete: ${finalProcessedCount} processed, ${finalErrorCount} errors`);
      currentBatchContext = null;
      return;
    }

    const source = pendingSources[0];
    console.log(`Processing: ${source.source.substring(0, 80)}...`);
    
    const result = await processUrlSource(supabase, source.id, source.agent_id, source.source);
    
    if (result.success) {
      processed++;
    } else {
      errors++;
      console.error(`Failed to process URL: ${result.error}`);
    }
    
    urlsProcessedThisBatch++;

    // Delay between URLs
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_URLS_MS));
  }

  // Get accurate count of remaining pending sources
  const { count: remainingCount } = await supabase
    .from('knowledge_sources')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .contains('metadata', { batch_id: batchId });

  const remaining = remainingCount || 0;
  
  // Sync urls_found with actual child count
  const actualChildCount = await syncUrlsFound(supabase, parentSourceId);
  
  // Update parent source with progress
  const updatedProcessedCount = (parentMetadata.processed_count as number || 0) + processed;
  const updatedErrorCount = (parentMetadata.error_count as number || 0) + errors;
  
  parentMetadata = {
    ...parentMetadata,
    is_sitemap: true,
    batch_id: batchId,
    urls_found: actualChildCount,
    processed_count: updatedProcessedCount,
    error_count: updatedErrorCount,
    remaining_count: remaining,
    last_progress_at: new Date().toISOString(),
  };
  
  await supabase
    .from('knowledge_sources')
    .update({ metadata: parentMetadata })
    .eq('id', parentSourceId);

  console.log(`Progress: ${updatedProcessedCount} processed, ${updatedErrorCount} errors, ${remaining} remaining`);

  // Check completion status
  if (remaining === 0) {
    // Check if there are still sources being processed (not yet done)
    const { count: processingCount } = await supabase
      .from('knowledge_sources')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing')
      .contains('metadata', { batch_id: batchId });

    if (!processingCount || processingCount === 0) {
      // All done! Mark parent as ready
      console.log('All sources complete - marking parent as ready');
      
      // Get final accurate counts
      const { count: finalReadyCount } = await supabase
        .from('knowledge_sources')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ready')
        .contains('metadata', { parent_source_id: parentSourceId });

      const { count: finalErrorCount } = await supabase
        .from('knowledge_sources')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'error')
        .contains('metadata', { parent_source_id: parentSourceId });

      const finalChildCount = await syncUrlsFound(supabase, parentSourceId);

      await supabase
        .from('knowledge_sources')
        .update({
          status: 'ready',
          content: `Sitemap processed. ${finalReadyCount || 0} pages indexed successfully${finalErrorCount ? `, ${finalErrorCount} failed` : ''}.`,
          metadata: {
            ...parentMetadata,
            is_sitemap: true,
            batch_id: batchId,
            urls_found: finalChildCount,
            processed_count: finalReadyCount || 0,
            error_count: finalErrorCount || 0,
            remaining_count: 0,
            completed_at: new Date().toISOString(),
          },
        })
        .eq('id', parentSourceId);

      console.log(`Batch processing complete: ${finalReadyCount} processed, ${finalErrorCount} errors`);
    } else {
      // Still processing, trigger another check after delay
      console.log(`${processingCount} sources still processing - triggering next check`);
      await triggerNextBatch(parentSourceId, batchId, agentId);
    }
  } else {
    // More pending sources to process
    await triggerNextBatch(parentSourceId, batchId, agentId);
  }

  currentBatchContext = null;
}

// Check if URL matches a glob pattern
function matchesPattern(url: string, pattern: string): boolean {
  // Convert glob pattern to regex: /tag/* → /tag/.*
  const escapedPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except *
    .replace(/\*/g, '.*'); // Convert * to .*
  const regex = new RegExp(escapedPattern);
  return regex.test(url);
}

// Filter URLs based on include/exclude patterns and page limit
function filterUrls(
  urls: string[],
  options: {
    excludePatterns?: string[];
    includePatterns?: string[];
    pageLimit?: number;
  }
): string[] {
  let filtered = urls;

  // Apply exclude patterns
  if (options.excludePatterns && options.excludePatterns.length > 0) {
    filtered = filtered.filter(url => 
      !options.excludePatterns!.some(pattern => matchesPattern(url, pattern))
    );
  }

  // Apply include patterns (if specified, only include matching URLs)
  if (options.includePatterns && options.includePatterns.length > 0) {
    filtered = filtered.filter(url => 
      options.includePatterns!.some(pattern => matchesPattern(url, pattern))
    );
  }

  // Apply page limit
  const limit = options.pageLimit || 200;
  if (filtered.length > limit) {
    console.log(`Limiting URLs from ${filtered.length} to ${limit}`);
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

// Process a sitemap URL and create child sources
async function processSitemap(
  supabase: any,
  sourceId: string,
  agentId: string,
  userId: string,
  sitemapUrl: string,
  filterOptions?: {
    excludePatterns?: string[];
    includePatterns?: string[];
    pageLimit?: number;
  }
): Promise<{ urlCount: number; sitemapCount: number; batchId: string; filteredCount: number }> {
  console.log('Processing sitemap:', sitemapUrl);
  console.log('Filter options:', JSON.stringify(filterOptions));
  
  const response = await fetch(sitemapUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Pilot/1.0; +https://getpilot.io)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }
  
  const xml = await response.text();
  console.log(`Sitemap XML fetched: ${xml.length} characters`);
  
  let allUrls: string[] = [];
  let sitemapCount = 0;
  
  // Check if this is a sitemap index
  if (isSitemapIndex(xml)) {
    console.log('Detected sitemap index, extracting child sitemaps...');
    const childSitemaps = extractSitemapUrls(xml);
    sitemapCount = childSitemaps.length;
    console.log(`Found ${sitemapCount} child sitemaps`);
    
    // Fetch each child sitemap and extract URLs
    for (const childSitemapUrl of childSitemaps) {
      try {
        console.log('Fetching child sitemap:', childSitemapUrl);
        const childResponse = await fetch(childSitemapUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Pilot/1.0; +https://getpilot.io)',
          },
        });
        
        if (childResponse.ok) {
          const childXml = await childResponse.text();
          const childUrls = parseSitemapXml(childXml);
          console.log(`Found ${childUrls.length} URLs in child sitemap`);
          allUrls.push(...childUrls);
        }
        
        // Small delay between sitemap fetches
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch child sitemap ${childSitemapUrl}:`, error);
      }
    }
  } else {
    // Regular sitemap - just extract URLs
    allUrls = parseSitemapXml(xml);
  }
  
  console.log(`Total URLs found in sitemap: ${allUrls.length}`);
  
  // Filter out sitemap URLs from the list (we only want page URLs)
  const pageUrls = allUrls.filter(url => !isSitemapUrl(url));
  console.log(`Page URLs (excluding sitemaps): ${pageUrls.length}`);
  
  // Apply URL filtering based on options
  const filteredUrls = filterUrls(pageUrls, filterOptions || {});
  const filteredCount = pageUrls.length - filteredUrls.length;
  console.log(`URLs after filtering: ${filteredUrls.length} (${filteredCount} filtered out)`);
  
  // Create child knowledge sources for each URL
  const batchId = crypto.randomUUID();
  const childSources = filteredUrls.map(url => ({
    agent_id: agentId,
    user_id: userId,
    type: 'url',
    source: url,
    status: 'pending',
    metadata: {
      parent_source_id: sourceId,
      batch_id: batchId,
      added_at: new Date().toISOString(),
    },
  }));
  
  // Insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < childSources.length; i += BATCH_SIZE) {
    const batch = childSources.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('knowledge_sources')
      .insert(batch)
      .select('id');
    
    if (error) {
      console.error(`Failed to insert batch ${i / BATCH_SIZE + 1}:`, error);
    } else {
      insertedCount += data?.length || 0;
    }
  }
  
  console.log(`Created ${insertedCount} child knowledge sources`);
  
  return { urlCount: insertedCount, sitemapCount, batchId, filteredCount };
}

// Fetch URL content with Readability for clean HTML extraction
async function fetchUrlContent(url: string): Promise<string> {
  console.log('Fetching URL content:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Pilot/1.0; +https://getpilot.io)',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    // Handle PDF URLs - return error since PDF parsing is not supported
    if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
      throw new Error('PDF URL processing is not currently supported. Please upload the PDF file directly or use a different URL.');
    }
    
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    } else if (contentType.includes('text/html')) {
      const html = await response.text();
      
      // Use Readability for intelligent content extraction
      try {
        console.log('Using Readability for content extraction');
        const parser = new DOMParser();
        const document = parser.parseFromString(html, 'text/html');
        const reader = new Readability(document, {
          charThreshold: 50, // Lower threshold for smaller articles
        });
        const article = reader.parse();
        
        if (article && article.textContent) {
          // Clean up the extracted text
          const cleanedText = article.textContent
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
          
          console.log(`Readability extracted ${cleanedText.length} chars from "${article.title || 'Untitled'}"`);
          
          // Return with title if available
          if (article.title) {
            return `# ${article.title}\n\n${cleanedText}`;
          }
          return cleanedText;
        }
        
        console.log('Readability could not parse content, falling back to basic extraction');
      } catch (readabilityError) {
        console.error('Readability parsing failed, using fallback:', readabilityError);
      }
      
      // Fallback: Basic HTML to text extraction
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else if (contentType.includes('text/xml') || contentType.includes('application/xml')) {
      // Return raw XML for sitemap processing
      return await response.text();
    } else if (contentType.includes('text/')) {
      return await response.text();
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error(`Error fetching URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

Deno.serve(async (req) => {
  console.log('Received request to process knowledge source');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Track sourceId for error handling
  let sourceId: string | null = null;
  let supabase: any = null;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    sourceId = body.sourceId;
    const resumeMode = body.resume === true;
    const continueMode = body.continue === true;
    const batchIdFromRequest = body.batchId;
    const agentIdFromRequest = body.agentId;
    
    console.log('Processing knowledge source:', sourceId, 
      resumeMode ? '(RESUME MODE)' : '',
      continueMode ? '(CONTINUE MODE)' : ''
    );
    console.log('Using embedding model:', EMBEDDING_MODEL, `(${EMBEDDING_DIMENSIONS} dimensions)`);

    if (!sourceId) {
      throw new Error('sourceId is required');
    }

    // Handle continue mode (self-chaining continuation)
    if (continueMode && batchIdFromRequest && agentIdFromRequest) {
      console.log('Continuing batch processing (self-chain):', batchIdFromRequest);
      
      EdgeRuntime.waitUntil(
        processBatchAndContinue(supabase, sourceId, batchIdFromRequest, agentIdFromRequest)
          .catch(error => {
            console.error('Background batch processing failed:', error);
          })
      );

      return new Response(
        JSON.stringify({
          success: true,
          sourceId,
          continued: true,
          batchId: batchIdFromRequest,
          message: 'Batch continuation started',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the knowledge source
    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      console.error('Failed to find source:', sourceError);
      throw new Error('Knowledge source not found');
    }

    console.log('Source type:', source.type, '| Source:', source.source?.substring(0, 100));

    // Handle resume mode for stalled sitemaps
    const sourceMetadata = (source.metadata || {}) as KnowledgeSourceMetadata;
    if (resumeMode && sourceMetadata.is_sitemap && sourceMetadata.batch_id) {
      console.log('Resuming stalled sitemap processing, batch:', sourceMetadata.batch_id);
      
      // Start background batch processing using self-chaining
      EdgeRuntime.waitUntil(
        processBatchAndContinue(supabase, sourceId, sourceMetadata.batch_id, source.agent_id)
          .catch(error => {
            console.error('Background batch processing failed:', error);
          })
      );

      return new Response(
        JSON.stringify({
          success: true,
          sourceId,
          resumed: true,
          message: 'Resuming sitemap processing...',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if this is a sitemap URL
    if (source.type === 'url' && isSitemapUrl(source.source)) {
      console.log('Detected sitemap URL, processing as sitemap...');
      
      // Delete existing child sources before reprocessing to prevent duplicates
      console.log('Cleaning up existing child sources...');
      const { data: existingChildren, error: fetchChildrenError } = await supabase
        .from('knowledge_sources')
        .select('id')
        .contains('metadata', { parent_source_id: sourceId });
      
      if (!fetchChildrenError && existingChildren && existingChildren.length > 0) {
        console.log(`Deleting ${existingChildren.length} existing child sources...`);
        const childIds = existingChildren.map((c: { id: string }) => c.id);
        
        // Delete chunks for these children first (CASCADE should handle this, but being explicit)
        await supabase
          .from('knowledge_chunks')
          .delete()
          .in('source_id', childIds);
        
        // Delete the child sources
        const { error: deleteChildrenError } = await supabase
          .from('knowledge_sources')
          .delete()
          .in('id', childIds);
        
        if (deleteChildrenError) {
          console.warn('Failed to delete some existing children:', deleteChildrenError);
        } else {
          console.log('Existing child sources deleted successfully');
        }
      }
      
      // Extract filter options from source metadata
      const filterMetadata = (source.metadata || {}) as KnowledgeSourceMetadata;
      const filterOptions = {
        excludePatterns: filterMetadata.exclude_patterns || [],
        includePatterns: filterMetadata.include_patterns || [],
        pageLimit: filterMetadata.page_limit || 200,
      };
      
      const { urlCount, sitemapCount, batchId, filteredCount } = await processSitemap(
        supabase,
        sourceId,
        source.agent_id,
        source.user_id,
        source.source,
        filterOptions
      );
      
      // Update the sitemap source with initial metadata
      const { error: updateError } = await supabase
        .from('knowledge_sources')
        .update({
          status: 'processing',
          content: `Sitemap parsed. Processing ${urlCount} page URLs${sitemapCount > 0 ? ` from ${sitemapCount} child sitemaps` : ''}${filteredCount > 0 ? ` (${filteredCount} filtered out)` : ''}...`,
          metadata: {
            ...sourceMetadata,
            processed_at: new Date().toISOString(),
            is_sitemap: true,
            urls_found: urlCount,
            urls_filtered: filteredCount,
            child_sitemaps: sitemapCount,
            batch_id: batchId,
            processed_count: 0,
            error_count: 0,
            remaining_count: urlCount,
          },
        })
        .eq('id', sourceId);

      if (updateError) {
        throw updateError;
      }

      console.log(`Sitemap parsed: ${urlCount} URLs queued (${filteredCount} filtered). Starting self-chaining batch processing...`);

      // Start background batch processing using self-chaining
      EdgeRuntime.waitUntil(
        processBatchAndContinue(supabase, sourceId, batchId, source.agent_id)
          .catch(error => {
            console.error('Background batch processing failed:', error);
          })
      );

      return new Response(
        JSON.stringify({
          success: true,
          sourceId,
          isSitemap: true,
          urlsFound: urlCount,
          urlsFiltered: filteredCount,
          childSitemaps: sitemapCount,
          batchId,
          message: `Processing ${urlCount} pages with self-chaining batches...`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let content = source.content || '';

    // Fetch content based on type
    if (source.type === 'url' && !content) {
      content = await fetchUrlContent(source.source);
    } else if (source.type === 'pdf') {
      // PDF file upload processing is not currently supported
      throw new Error('PDF processing is not currently supported. Please delete this source and try adding a URL or text content instead.');
    }

    if (!content || content.length === 0) {
      throw new Error('No content to process - the URL may be empty or inaccessible');
    }

    console.log(`Content fetched: ${content.length} characters`);

    // Update content if it was fetched
    if (!source.content) {
      await supabase
        .from('knowledge_sources')
        .update({ content })
        .eq('id', sourceId);
    }

    // Delete any existing chunks for this source (for reprocessing)
    const { error: deleteError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('source_id', sourceId);
    
    if (deleteError) {
      console.warn('Failed to delete existing chunks:', deleteError);
    }

    // Chunk the content with semantic boundaries
    console.log('Chunking content with semantic boundaries...');
    const chunks = chunkText(content, 500, 50);
    console.log(`Created ${chunks.length} chunks`);

    // Generate embeddings for all chunks
    console.log('Generating embeddings for all chunks...');
    const embeddings = await generateEmbeddingsBatch(chunks, 5, 200);

    // Store chunks with embeddings
    console.log('Storing chunks in database...');
    let successfulChunks = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      
      if (embedding) {
        const embeddingVector = `[${embedding.join(',')}]`;
        
        const { error: insertError } = await supabase
          .from('knowledge_chunks')
          .insert({
            source_id: sourceId,
            agent_id: source.agent_id,
            chunk_index: i,
            content: chunk.content,
            embedding: embeddingVector,
            token_count: chunk.tokenCount,
            metadata: {
              original_length: chunk.content.length,
              embedding_model: EMBEDDING_MODEL,
            }
          });

        if (insertError) {
          console.error(`Failed to insert chunk ${i}:`, insertError);
        } else {
          successfulChunks++;
        }
      }
    }

    // Update the knowledge source status and metadata
    const { error: updateError } = await supabase
      .from('knowledge_sources')
      .update({
        status: 'ready',
        metadata: {
          ...((source.metadata || {}) as KnowledgeSourceMetadata),
          processed_at: new Date().toISOString(),
          chunks_count: successfulChunks,
          total_chunks: chunks.length,
          content_length: content.length,
          chunking_version: 2,
          embedding_model: EMBEDDING_MODEL,
          embedding_dimensions: EMBEDDING_DIMENSIONS,
        },
      })
      .eq('id', sourceId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Knowledge source processed successfully: ${successfulChunks}/${chunks.length} chunks stored`);

    return new Response(
      JSON.stringify({
        success: true,
        sourceId,
        chunks: successfulChunks,
        totalChunks: chunks.length,
        embeddingModel: EMBEDDING_MODEL,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing knowledge source:', error);
    
    // Update status to error if we have sourceId and supabase client
    // IMPORTANT: Preserve existing metadata when marking as error
    if (sourceId && supabase) {
      try {
        // Fetch existing metadata first
        const { data: currentSource } = await supabase
          .from('knowledge_sources')
          .select('metadata')
          .eq('id', sourceId)
          .single();
        
        const existingMetadata = (currentSource?.metadata as Record<string, unknown>) || {};
        
        await supabase
          .from('knowledge_sources')
          .update({
            status: 'error',
            metadata: {
              ...existingMetadata,
              error: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString(),
            },
          })
          .eq('id', sourceId);
        console.log('Updated source status to error');
      } catch (e) {
        console.error('Failed to update error status:', e);
      }
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
