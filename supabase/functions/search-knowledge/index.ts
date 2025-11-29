import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate query embedding using Lovable AI
async function generateQueryEmbedding(query: string): Promise<number[]> {
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
      input: query,
      model: 'text-embedding-3-small',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding generation failed: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { agentId, query, matchThreshold = 0.7, matchCount = 5 } = await req.json();

    if (!agentId || !query) {
      return new Response(
        JSON.stringify({ error: 'agentId and query are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Searching knowledge for agent:', agentId, 'query:', query);

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);
    const embeddingVector = `[${queryEmbedding.join(',')}]`;

    // Search for similar knowledge sources
    const { data, error } = await supabase.rpc('search_knowledge_sources', {
      p_agent_id: agentId,
      p_query_embedding: embeddingVector,
      p_match_threshold: matchThreshold,
      p_match_count: matchCount,
    });

    if (error) {
      console.error('Error searching knowledge:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} relevant knowledge sources`);

    // Format results
    const results = (data || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      source: item.source,
      content: item.content?.substring(0, 2000), // Limit content length
      similarity: item.similarity,
      metadata: item.metadata,
    }));

    return new Response(
      JSON.stringify({
        results,
        count: results.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in search-knowledge function:', error);
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
