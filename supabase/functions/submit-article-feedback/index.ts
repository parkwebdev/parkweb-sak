import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple HTML entity encoding for comment sanitization
const sanitizeText = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { articleId, sessionId, isHelpful, comment } = await req.json();

    // Validate required fields
    if (!articleId || !sessionId || isHelpful === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate articleId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(articleId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid article ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate sessionId length
    if (typeof sessionId !== 'string' || sessionId.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid session ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize comment if provided
    let sanitizedComment: string | null = null;
    if (comment) {
      if (typeof comment !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Comment must be a string' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (comment.length > 1000) {
        return new Response(
          JSON.stringify({ error: 'Comment must be less than 1000 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      sanitizedComment = sanitizeText(comment);
    }

    // Rate limiting: Check for recent feedback from same session (1 per minute per article)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentFeedback } = await supabase
      .from('article_feedback')
      .select('id')
      .eq('session_id', sessionId)
      .eq('article_id', articleId)
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (recentFeedback && recentFeedback.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Please wait before submitting more feedback' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert feedback
    const { error } = await supabase
      .from('article_feedback')
      .insert({
        article_id: articleId,
        session_id: sessionId,
        is_helpful: isHelpful,
        comment: sanitizedComment,
      });

    if (error) {
      // Handle unique constraint violation (already submitted)
      if (error.code === '23505') {
        return new Response(
          JSON.stringify({ error: 'You have already provided feedback for this article' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in submit-article-feedback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
