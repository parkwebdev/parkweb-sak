import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces for embedding
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate embeddings using Lovable AI
async function generateEmbedding(text: string): Promise<number[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small', // Using OpenAI's embedding model through Lovable AI
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding generation failed: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Fetch URL content
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const json = await response.json();
      return JSON.stringify(json, null, 2);
    } else if (contentType.includes('text/')) {
      return await response.text();
    } else {
      throw new Error('Unsupported content type');
    }
  } catch (error) {
    throw new Error(`Error fetching URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
      // For PDFs stored in storage, we'd need to fetch and parse
      // For now, we'll skip automatic PDF parsing and expect content to be provided
      console.log('PDF processing not yet implemented, expecting content field');
      if (!content) {
        throw new Error('PDF content not provided');
      }
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

    // Chunk the content
    console.log('Chunking content...');
    const chunks = chunkText(content, 1000);
    console.log(`Created ${chunks.length} chunks`);

    // Generate embeddings for each chunk and store
    // For simplicity, we'll generate an embedding for the full content
    // In production, you'd want to chunk and store multiple embeddings
    console.log('Generating embedding...');
    const embedding = await generateEmbedding(content.substring(0, 8000)); // Limit to 8000 chars for embedding

    // Convert embedding array to PostgreSQL vector format
    const embeddingVector = `[${embedding.join(',')}]`;

    // Update the knowledge source with embedding
    const { error: updateError } = await supabase
      .from('knowledge_sources')
      .update({
        embedding: embeddingVector,
        status: 'ready',
        metadata: {
          ...((source.metadata as any) || {}),
          processed_at: new Date().toISOString(),
          chunks_count: chunks.length,
          content_length: content.length,
        },
      })
      .eq('id', sourceId);

    if (updateError) {
      throw updateError;
    }

    console.log('Knowledge source processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        sourceId,
        chunks: chunks.length,
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
