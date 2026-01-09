/**
 * Trigger Automation
 * Receives events and triggers matching automations.
 * Handles event-based, manual, and schedule triggers.
 * 
 * @module trigger-automation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { matchAutomations, shouldRunSchedule, type EventPayload } from '../_shared/automation/trigger-matcher.ts';
import type { Automation, TriggerScheduleConfig } from '../_shared/automation/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
};

interface TriggerRequest {
  source: 'database' | 'manual' | 'schedule' | 'api';
  payload?: EventPayload;
  agentId?: string;
  automationId?: string;
  triggerData?: Record<string, unknown>;
  testMode?: boolean;
  conversationId?: string;
  leadId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  // Service role client for database operations
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Try to parse request body - empty body means cron scheduler call
    let request: TriggerRequest | null = null;
    let isCronCall = false;

    try {
      const body = await req.text();
      if (body && body.trim()) {
        request = JSON.parse(body);
      } else {
        // Empty body = cron scheduler call
        isCronCall = true;
      }
    } catch {
      // Invalid JSON or empty = treat as cron call
      isCronCall = true;
    }

    // Handle cron-triggered schedule check (no auth needed - internal edge function schedule)
    if (isCronCall) {
      console.log('[trigger-automation] Cron-triggered schedule check');
      return await handleScheduleTriggers(supabaseAdmin, supabaseUrl, serviceRoleKey);
    }

    // For non-cron calls, require authentication
    const internalSecret = req.headers.get('x-internal-secret');
    const authHeader = req.headers.get('authorization');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    let userId: string | null = null;
    let isInternalCall = false;

    if (internalSecret === expectedSecret) {
      isInternalCall = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      // Create a client with user's auth header for JWT validation
      const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      // Verify JWT using getClaims
      const token = authHeader.replace('Bearer ', '');
      const { data, error: authError } = await supabaseWithAuth.auth.getClaims(token);
      
      if (authError || !data?.claims) {
        console.error('[trigger-automation] Auth error:', authError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      userId = data.claims.sub as string;
    } else {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!request) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const { source, payload, automationId, triggerData, testMode, conversationId, leadId } = request;

    let triggered = 0;
    const results: Array<{ automationId: string; executionId?: string; error?: string }> = [];

    // Handle different trigger sources
    if (source === 'manual' && automationId) {
      // Manual trigger - run specific automation
      const { data: automation, error: fetchError } = await supabaseAdmin
        .from('automations')
        .select('*')
        .eq('id', automationId)
        .single();

      if (fetchError || !automation) {
        return new Response(
          JSON.stringify({ error: 'Automation not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user has access (if not internal call)
      if (!isInternalCall && userId) {
        const { data: hasAccess } = await supabaseAdmin.rpc('has_account_access', {
          account_owner_id: automation.user_id
        });

        if (!hasAccess) {
          return new Response(
            JSON.stringify({ error: 'Access denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Execute the automation
      const executionResult = await executeAutomation(
        supabaseAdmin,
        supabaseUrl,
        serviceRoleKey,
        automation,
        'manual',
        triggerData || {},
        testMode || false,
        conversationId,
        leadId,
        userId
      );

      triggered = 1;
      results.push({
        automationId: automation.id,
        executionId: executionResult.executionId,
        error: executionResult.error,
      });

    } else if (source === 'database' && payload) {
      // Database event trigger - find and run matching automations
      // Get agent_id from the payload or look it up
      let agentId = request.agentId;

      if (!agentId && payload.table === 'conversations') {
        agentId = payload.record.agent_id as string;
      }

      if (!agentId && payload.table === 'messages') {
        // Look up conversation to get agent_id
        const { data: conversation } = await supabaseAdmin
          .from('conversations')
          .select('agent_id, user_id')
          .eq('id', payload.record.conversation_id)
          .single();
        
        if (conversation) {
          agentId = conversation.agent_id;
        }
      }

      if (!agentId && payload.table === 'leads') {
        // Get agent via user's agent
        const { data: agent } = await supabaseAdmin
          .from('agents')
          .select('id')
          .eq('user_id', payload.record.user_id)
          .limit(1)
          .single();
        
        if (agent) {
          agentId = agent.id;
        }
      }

      if (!agentId) {
        console.log('Could not determine agent_id for event, skipping');
        return new Response(
          JSON.stringify({ triggered: 0, message: 'No agent context' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch enabled event automations for this agent
      const { data: automations, error: fetchError } = await supabaseAdmin
        .from('automations')
        .select('*')
        .eq('agent_id', agentId)
        .eq('trigger_type', 'event')
        .eq('enabled', true)
        .eq('status', 'active');

      if (fetchError) {
        console.error('Error fetching automations:', fetchError);
        throw fetchError;
      }

      if (!automations || automations.length === 0) {
        return new Response(
          JSON.stringify({ triggered: 0, message: 'No matching automations' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Match automations against the event
      const matched = matchAutomations(automations as Automation[], payload);
      
      console.log(`Matched ${matched.length} automations for ${payload.table}.${payload.type}`);

      // Execute each matched automation
      for (const match of matched) {
        const executionResult = await executeAutomation(
          supabaseAdmin,
          supabaseUrl,
          serviceRoleKey,
          match.automation,
          'event',
          match.triggerData,
          false,
          undefined,
          match.triggerData.lead?.id as string | undefined
        );

        triggered++;
        results.push({
          automationId: match.automation.id,
          executionId: executionResult.executionId,
          error: executionResult.error,
        });
      }

    } else if (source === 'schedule') {
      // Schedule trigger - check all schedule automations
      const { data: automations, error: fetchError } = await supabaseAdmin
        .from('automations')
        .select('*')
        .eq('trigger_type', 'schedule')
        .eq('enabled', true)
        .eq('status', 'active');

      if (fetchError) {
        console.error('Error fetching schedule automations:', fetchError);
        throw fetchError;
      }

      if (!automations || automations.length === 0) {
        return new Response(
          JSON.stringify({ triggered: 0, message: 'No schedule automations' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const now = new Date();

      for (const automation of automations) {
        const config = automation.trigger_config as TriggerScheduleConfig;
        
        if (shouldRunSchedule(
          config.cron,
          config.timezone || 'UTC',
          automation.last_executed_at,
          now
        )) {
          const executionResult = await executeAutomation(
            supabaseAdmin,
            supabaseUrl,
            serviceRoleKey,
            automation as Automation,
            'schedule',
            { scheduled_at: now.toISOString() },
            false
          );

          triggered++;
          results.push({
            automationId: automation.id,
            executionId: executionResult.executionId,
            error: executionResult.error,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        triggered,
        results,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in trigger-automation:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        triggered: 0,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Handle cron-triggered schedule checks
 */
async function handleScheduleTriggers(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<Response> {
  const { data: automations, error: fetchError } = await supabase
    .from('automations')
    .select('*')
    .eq('trigger_type', 'schedule')
    .eq('enabled', true)
    .eq('status', 'active');

  if (fetchError) {
    console.error('Error fetching schedule automations:', fetchError);
    return new Response(
      JSON.stringify({ error: fetchError.message, triggered: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!automations || automations.length === 0) {
    return new Response(
      JSON.stringify({ triggered: 0, message: 'No schedule automations' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const now = new Date();
  let triggered = 0;
  const results: Array<{ automationId: string; executionId?: string; error?: string }> = [];

  for (const automation of automations) {
    const config = automation.trigger_config as TriggerScheduleConfig;
    
    if (shouldRunSchedule(
      config.cron,
      config.timezone || 'America/New_York',
      automation.last_executed_at,
      now
    )) {
      const executionResult = await executeAutomation(
        supabase,
        supabaseUrl,
        serviceRoleKey,
        automation as Automation,
        'schedule',
        { scheduled_at: now.toISOString() },
        false
      );

      triggered++;
      results.push({
        automationId: automation.id,
        executionId: executionResult.executionId,
        error: executionResult.error,
      });
    }
  }

  console.log(`[trigger-automation] Schedule check complete: ${triggered} automations triggered`);

  return new Response(
    JSON.stringify({ success: true, triggered, results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Execute a single automation
 */
async function executeAutomation(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceRoleKey: string,
  automation: Automation,
  triggerType: 'event' | 'schedule' | 'manual' | 'ai_tool',
  triggerData: Record<string, unknown>,
  testMode: boolean,
  conversationId?: string,
  leadId?: string,
  triggeredBy?: string | null
): Promise<{ executionId?: string; error?: string }> {
  try {
    // Call execute-automation function
    const response = await fetch(
      `${supabaseUrl}/functions/v1/execute-automation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          automationId: automation.id,
          triggerType,
          triggerData,
          testMode,
          conversationId,
          leadId,
          triggeredBy,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to execute automation ${automation.id}:`, errorText);
      return { error: errorText };
    }

    const result = await response.json();
    return { executionId: result.executionId };

  } catch (error) {
    console.error(`Error executing automation ${automation.id}:`, error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
