/**
 * Automation Tools
 * 
 * Handles conversion of ai_tool automations to OpenAI function format
 * and execution of automation triggers from AI tool calls.
 * 
 * @module _shared/tools/automation-tools
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/** Automation record from database */
interface AutomationRecord {
  id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  enabled: boolean;
}

/** AI Tool trigger config */
interface TriggerAIToolConfig {
  toolName: string;
  toolDescription: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
    required: boolean;
  }>;
}

/** OpenAI function tool format */
export interface AutomationToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/** Result from fetching automation tools */
export interface AutomationToolsResult {
  tools: AutomationToolDefinition[];
  automationMap: Map<string, string>; // toolName -> automationId
}

/**
 * Fetch automations configured as AI tools and convert to OpenAI format.
 * Returns both the tool definitions and a map to look up automation IDs.
 */
export async function fetchAutomationTools(
  supabase: ReturnType<typeof createClient>,
  agentId: string
): Promise<AutomationToolsResult> {
  const { data: automations, error } = await supabase
    .from('automations')
    .select('id, name, trigger_type, trigger_config, enabled')
    .eq('agent_id', agentId)
    .eq('trigger_type', 'ai_tool')
    .eq('enabled', true)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching automation tools:', error);
    return { tools: [], automationMap: new Map() };
  }

  const tools: AutomationToolDefinition[] = [];
  const automationMap = new Map<string, string>();

  for (const automation of (automations || []) as AutomationRecord[]) {
    const config = automation.trigger_config as TriggerAIToolConfig | null;
    if (!config?.toolName) continue;

    // Prefix tool name to avoid conflicts with other tools
    const toolName = `automation_${config.toolName}`;

    // Build OpenAI parameter schema
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const param of config.parameters || []) {
      properties[param.name] = {
        type: param.type,
        description: param.description,
      };
      if (param.required) {
        required.push(param.name);
      }
    }

    tools.push({
      type: 'function',
      function: {
        name: toolName,
        description: config.toolDescription || `Trigger the ${automation.name} automation`,
        parameters: {
          type: 'object',
          properties,
          ...(required.length > 0 ? { required } : {}),
        },
      },
    });

    automationMap.set(toolName, automation.id);
  }

  console.log(`Found ${tools.length} automation tools for agent ${agentId}`);
  return { tools, automationMap };
}

/**
 * Execute an automation tool call by triggering the automation.
 */
export async function executeAutomationTool(
  supabaseUrl: string,
  serviceRoleKey: string,
  automationId: string,
  toolArgs: Record<string, unknown>,
  conversationId: string,
  leadId?: string
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/trigger-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        source: 'ai_tool',
        automationId,
        triggerData: {
          ...toolArgs,
          conversationId,
          leadId,
        },
        testMode: false,
        conversationId,
        leadId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Automation trigger failed:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    
    // Check for execution errors
    if (data.results?.[0]?.error) {
      return { 
        success: false, 
        error: data.results[0].error 
      };
    }

    return { 
      success: true, 
      result: data.results?.[0]?.output || { triggered: true } 
    };
  } catch (error) {
    console.error('Error executing automation tool:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
