import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { getDocument } from 'https://esm.sh/pdfjs-serverless@0.6.0';
import { Readability } from 'https://esm.sh/@mozilla/readability@0.5.0';
import { parseHTML } from 'https://esm.sh/linkedom@0.18.4';

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

// Extract text from PDF using pdfjs-serverless
async function extractPdfText(pdfData: Uint8Array): Promise<string> {
  console.log('Extracting text from PDF...');
  
  const document = await getDocument({
    data: pdfData,
    useSystemFonts: true,
  }).promise;

  const textParts: string[] = [];
  const numPages = document.numPages;
  console.log(`PDF has ${numPages} pages`);

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await document.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n\n');
}

// Fetch URL content with Readability for clean HTML extraction
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChatPad/1.0; +https://chatpad.ai)',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    } else if (contentType.includes('text/html')) {
      const html = await response.text();
      
      // Use Readability for intelligent content extraction
      try {
        console.log('Using Readability for content extraction from:', url);
        const { document } = parseHTML(html);
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
    } else if (contentType.includes('text/')) {
      return await response.text();
    } else {
      throw new Error('Unsupported content type');
    }
  } catch (error) {
    throw new Error(`Error fetching URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Fetch PDF from storage and extract text
async function fetchAndExtractPdf(supabase: any, storagePath: string): Promise<string> {
  console.log('Downloading PDF from storage:', storagePath);
  
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('conversation-files')
    .download(storagePath);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download PDF: ${downloadError?.message || 'Unknown error'}`);
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const pdfData = new Uint8Array(arrayBuffer);
  
  return await extractPdfText(pdfData);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sourceId } = await req.json();
    console.log('Processing knowledge source:', sourceId);
    console.log('Using embedding model:', EMBEDDING_MODEL, `(${EMBEDDING_DIMENSIONS} dimensions)`);

    // Get the knowledge source
    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      throw new Error('Knowledge source not found');
    }

    let content = source.content || '';

    // Fetch content based on type
    if (source.type === 'url' && !content) {
      console.log('Fetching URL content:', source.source);
      content = await fetchUrlContent(source.source);
    } else if (source.type === 'pdf') {
      console.log('Processing PDF:', source.source);
      // The 'source' field contains the storage path for PDFs
      content = await fetchAndExtractPdf(supabase, source.source);
    }

    if (!content || content.length === 0) {
      throw new Error('No content to process');
    }

    // Update content if it was fetched
    if (!source.content) {
      await supabase
        .from('knowledge_sources')
        .update({ content })
        .eq('id', sourceId);
    }

    // Delete any existing chunks for this source (for reprocessing)
    await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('source_id', sourceId);

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
    
    // Update status to error
    try {
      const { sourceId } = await req.json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
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
    } catch (e) {
      console.error('Failed to update error status:', e);
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
