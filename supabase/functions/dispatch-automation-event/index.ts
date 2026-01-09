/**
 * Dispatch Automation Event
 * Lightweight function called by database triggers to forward events
 * to the trigger-automation function.
 * 
 * @module dispatch-automation-event
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

interface EventPayload {
  type: 'insert' | 'update' | 'delete';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret (called from database trigger)
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
    
    if (!internalSecret || internalSecret !== expectedSecret) {
      console.error('Invalid internal secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: EventPayload = await req.json();
    
    // Validate payload structure
    if (!payload.type || !payload.table || !payload.record) {
      console.error('Invalid payload structure:', payload);
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only process relevant tables
    const relevantTables = ['leads', 'conversations', 'messages', 'calendar_events'];
    if (!relevantTables.includes(payload.table)) {
      return new Response(
        JSON.stringify({ message: 'Table not relevant for automations' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Dispatching automation event: ${payload.table}.${payload.type}`);

    // Get the agent_id from the record to scope the automation search
    let agentId: string | null = null;
    
    if (payload.table === 'leads') {
      // Leads don't have agent_id directly, need to look it up via user_id
      // For now, we'll pass the user_id and let trigger-automation handle it
      agentId = null;
    } else if (payload.table === 'conversations') {
      agentId = payload.record.agent_id as string;
    } else if (payload.table === 'messages') {
      // Messages don't have agent_id, will be resolved via conversation
      agentId = null;
    } else if (payload.table === 'calendar_events') {
      // Calendar events need to resolve via connected_account -> agent_id
      // For now, we'll let trigger-automation handle the lookup
      agentId = null;
    }

    // Forward to trigger-automation function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const triggerResponse = await fetch(
      `${supabaseUrl}/functions/v1/trigger-automation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'x-internal-secret': expectedSecret,
        },
        body: JSON.stringify({
          source: 'database',
          payload,
          agentId,
        }),
      }
    );

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error('Failed to trigger automation:', errorText);
      // Don't fail the response - we don't want to block the original transaction
    }

    const result = await triggerResponse.json().catch(() => ({}));

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Event dispatched',
        triggered: result.triggered || 0,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in dispatch-automation-event:', error);
    
    // Always return success to not block database transactions
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Event dispatch attempted',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
