import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI text-embedding-3-small - 1536 dimensions
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

// Strip HTML tags and extract clean text from article content
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { articleId, title, content } = await req.json();
    
    if (!articleId) {
      throw new Error('Article ID is required');
    }

    console.log('Embedding help article:', articleId, 'title:', title?.substring(0, 50));

    // Create combined text for embedding (title + clean content)
    const cleanContent = stripHtml(content || '');
    const textToEmbed = `${title || ''}\n\n${cleanContent}`.trim();

    if (!textToEmbed || textToEmbed.length < 10) {
      console.log('Article content too short to embed, skipping');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'content_too_short' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding
    console.log('Generating embedding for article, text length:', textToEmbed.length);
    const embedding = await generateEmbedding(textToEmbed);

    // Store embedding in help_articles table
    const embeddingVector = `[${embedding.join(',')}]`;
    
    const { error: updateError } = await supabase
      .from('help_articles')
      .update({ embedding: embeddingVector })
      .eq('id', articleId);

    if (updateError) {
      throw updateError;
    }

    console.log('Successfully embedded help article:', articleId);

    return new Response(
      JSON.stringify({
        success: true,
        articleId,
        embeddingDimensions: embedding.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error embedding help article:', error);
    
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
