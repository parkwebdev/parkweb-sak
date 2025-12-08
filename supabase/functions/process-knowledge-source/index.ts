import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Readability } from "npm:@mozilla/readability@0.5.0";
import { DOMParser } from "npm:linkedom@0.18.4";

console.log('process-knowledge-source function initialized');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI text-embedding-3-small - 1536 dimensions
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

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

// Generate embeddings using OpenAI text-embedding-3-small
async function generateEmbedding(text: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
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
  return data.data[0].embedding;
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

    // Update source status to ready
    await supabase
      .from('knowledge_sources')
      .update({
        status: 'ready',
        metadata: {
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
    
    // Update source status to error
    await supabase
      .from('knowledge_sources')
      .update({
        status: 'error',
        metadata: {
          error: errorMessage,
          failed_at: new Date().toISOString(),
        },
      })
      .eq('id', sourceId);

    return { success: false, error: errorMessage };
  }
}

// Process pending child sources in batches with rate limiting
async function processPendingBatch(
  supabase: any,
  parentSourceId: string,
  batchId: string,
  agentId: string
): Promise<void> {
  const CONCURRENT_LIMIT = 3; // Process 3 URLs at a time
  const DELAY_BETWEEN_BATCHES_MS = 2000; // 2 second delay between batches
  const DELAY_BETWEEN_URLS_MS = 500; // 0.5 second delay between individual URLs

  console.log(`Starting batch processing for parent ${parentSourceId}, batch ${batchId}`);

  let processed = 0;
  let errors = 0;
  let hasMore = true;

  while (hasMore) {
    // Get next batch of pending sources
    const { data: pendingSources, error: fetchError } = await supabase
      .from('knowledge_sources')
      .select('id, source, agent_id')
      .eq('status', 'pending')
      .contains('metadata', { batch_id: batchId })
      .limit(CONCURRENT_LIMIT);

    if (fetchError) {
      console.error('Error fetching pending sources:', fetchError);
      break;
    }

    if (!pendingSources || pendingSources.length === 0) {
      hasMore = false;
      console.log('No more pending sources to process');
      break;
    }

    console.log(`Processing batch of ${pendingSources.length} URLs...`);

    // Process batch concurrently
    const results = await Promise.all(
      pendingSources.map(async (source: any, index: number) => {
        // Stagger start times slightly
        await new Promise(resolve => setTimeout(resolve, index * DELAY_BETWEEN_URLS_MS));
        
        console.log(`Processing: ${source.source.substring(0, 80)}...`);
        return processUrlSource(supabase, source.id, source.agent_id, source.source);
      })
    );

    // Count results
    for (const result of results) {
      if (result.success) {
        processed++;
      } else {
        errors++;
        console.error(`Failed to process URL: ${result.error}`);
      }
    }

    // Update parent source with progress
    const { data: remainingCount } = await supabase
      .from('knowledge_sources')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .contains('metadata', { batch_id: batchId });

    const remaining = remainingCount?.length || 0;
    
    await supabase
      .from('knowledge_sources')
      .update({
        metadata: {
          is_sitemap: true,
          batch_id: batchId,
          processed_count: processed,
          error_count: errors,
          remaining_count: remaining,
          last_progress_at: new Date().toISOString(),
        },
      })
      .eq('id', parentSourceId);

    console.log(`Progress: ${processed} processed, ${errors} errors, ${remaining} remaining`);

    // Delay before next batch
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  // Final update to parent source
  await supabase
    .from('knowledge_sources')
    .update({
      content: `Sitemap processed. ${processed} pages indexed successfully${errors > 0 ? `, ${errors} failed` : ''}.`,
      metadata: {
        is_sitemap: true,
        batch_id: batchId,
        processed_count: processed,
        error_count: errors,
        remaining_count: 0,
        completed_at: new Date().toISOString(),
      },
    })
    .eq('id', parentSourceId);

  console.log(`Batch processing complete: ${processed} processed, ${errors} errors`);
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
      'User-Agent': 'Mozilla/5.0 (compatible; ChatPad/1.0; +https://chatpad.ai)',
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
            'User-Agent': 'Mozilla/5.0 (compatible; ChatPad/1.0; +https://chatpad.ai)',
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
        'User-Agent': 'Mozilla/5.0 (compatible; ChatPad/1.0; +https://chatpad.ai)',
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
    
    console.log('Processing knowledge source:', sourceId);
    console.log('Using embedding model:', EMBEDDING_MODEL, `(${EMBEDDING_DIMENSIONS} dimensions)`);

    if (!sourceId) {
      throw new Error('sourceId is required');
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

    // Check if this is a sitemap URL
    if (source.type === 'url' && isSitemapUrl(source.source)) {
      console.log('Detected sitemap URL, processing as sitemap...');
      
      // Extract filter options from source metadata
      const sourceMetadata = (source.metadata as any) || {};
      const filterOptions = {
        excludePatterns: sourceMetadata.exclude_patterns || [],
        includePatterns: sourceMetadata.include_patterns || [],
        pageLimit: sourceMetadata.page_limit || 200,
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

      console.log(`Sitemap parsed: ${urlCount} URLs queued (${filteredCount} filtered). Starting background batch processing...`);

      // Start background batch processing using EdgeRuntime.waitUntil
      // This allows the function to return immediately while processing continues
      EdgeRuntime.waitUntil(
        processPendingBatch(supabase, sourceId, batchId, source.agent_id)
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
          message: `Processing ${urlCount} pages in background...`,
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
          ...((source.metadata as any) || {}),
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
    if (sourceId && supabase) {
      try {
        await supabase
          .from('knowledge_sources')
          .update({
            status: 'error',
            metadata: {
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
