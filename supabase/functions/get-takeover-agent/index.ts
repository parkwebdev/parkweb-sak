import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the most recent active takeover for this conversation
    const { data: takeover, error: takeoverError } = await supabase
      .from('conversation_takeovers')
      .select('taken_over_by')
      .eq('conversation_id', conversationId)
      .is('returned_to_ai_at', null)
      .order('taken_over_at', { ascending: false })
      .limit(1)
      .single();

    if (takeoverError || !takeover) {
      return new Response(
        JSON.stringify({ agent: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the profile of the team member
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', takeover.taken_over_by)
      .single();

    // Mask last name for privacy (e.g., "John Smith" -> "John S.")
    const maskName = (fullName: string | null): string => {
      if (!fullName) return 'Team Member';
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      const firstName = parts[0];
      const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
      return `${firstName} ${lastInitial}.`;
    };

    const agent = profile ? {
      name: maskName(profile.display_name),
      avatar: profile.avatar_url,
    } : {
      name: 'Team Member',
      avatar: null,
    };

    return new Response(
      JSON.stringify({ agent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Get takeover agent error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
