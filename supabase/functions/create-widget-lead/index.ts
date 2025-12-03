import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimum time (ms) between form load and submission to consider legitimate
const MIN_FORM_TIME_MS = 2000; // 2 seconds

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { agentId, firstName, lastName, email, customFields, _formLoadTime } = await req.json();

    // Spam protection: Check timing (reject if submitted too fast)
    if (_formLoadTime) {
      const timeTaken = Date.now() - _formLoadTime;
      if (timeTaken < MIN_FORM_TIME_MS) {
        console.log(`Spam detected: Form submitted too fast (${timeTaken}ms)`);
        // Return success to not tip off bots, but don't create lead
        return new Response(
          JSON.stringify({ leadId: 'spam-blocked' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!agentId || !firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs (trim and limit length)
    const sanitizedFirstName = String(firstName).trim().slice(0, 50);
    const sanitizedLastName = String(lastName).trim().slice(0, 50);
    const sanitizedEmail = String(email).trim().toLowerCase().slice(0, 255);

    // Get agent details to find user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('user_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent not found:', agentError);
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: Check for recent submissions from same email (within 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('email', sanitizedEmail)
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (recentLeads && recentLeads.length > 0) {
      console.log(`Rate limit: Email ${sanitizedEmail} submitted recently`);
      // Return success to not tip off spammers
      return new Response(
        JSON.stringify({ leadId: 'rate-limited' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create lead (exclude internal fields from customFields)
    const { _formLoadTime: _, ...cleanCustomFields } = customFields || {};
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        user_id: agent.user_id,
        name: `${sanitizedFirstName} ${sanitizedLastName}`,
        email: sanitizedEmail,
        data: { firstName: sanitizedFirstName, lastName: sanitizedLastName, ...cleanCustomFields },
        status: 'new',
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create lead' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Lead created successfully: ${lead.id}`);
    return new Response(
      JSON.stringify({ leadId: lead.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-widget-lead:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
