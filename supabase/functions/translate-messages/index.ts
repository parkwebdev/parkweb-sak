import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  messages: Array<{ id: string; content: string }>;
  targetLanguage?: string; // Default: 'en' (English)
}

interface TranslateResponse {
  translations: Array<{ id: string; original: string; translated: string }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, targetLanguage = 'en' }: TranslateRequest = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit batch size to prevent abuse
    if (messages.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Maximum 50 messages per request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build translation prompt
    const messagesToTranslate = messages
      .map((m, i) => `[${i}] ${m.content}`)
      .join('\n---\n');

    const targetLangName = targetLanguage === 'en' ? 'English' : targetLanguage;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following messages to ${targetLangName}. 
Preserve the original meaning and tone. Output ONLY a JSON array with the translated text for each message in order.
Format: ["translated text 1", "translated text 2", ...]

If a message is already in ${targetLangName}, return it unchanged.
Do not add any explanation or commentary. Only output the JSON array.`
          },
          {
            role: 'user',
            content: messagesToTranslate
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Translation quota exceeded.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Translation API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Translation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || '';

    // Parse the JSON array from the response
    let translatedTexts: string[];
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      translatedTexts = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse translation response:', aiContent);
      return new Response(
        JSON.stringify({ error: 'Failed to parse translation response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build response with original and translated content
    const translations: TranslateResponse['translations'] = messages.map((msg, i) => ({
      id: msg.id,
      original: msg.content,
      translated: translatedTexts[i] || msg.content, // Fallback to original if translation missing
    }));

    console.log(`Translated ${translations.length} messages to ${targetLangName}`);

    return new Response(
      JSON.stringify({ translations } as TranslateResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});