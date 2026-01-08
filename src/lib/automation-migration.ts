/**
 * Automation Migration Utilities
 * Tools to migrate webhooks and agent_tools to the new automations system.
 * 
 * @module lib/automation-migration
 */

import { supabase } from "@/integrations/supabase/client";
import type { AutomationNode, AutomationEdge, CreateAutomationData } from "@/types/automations";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: string;
  events: string[] | null;
  headers: Record<string, string> | null;
  active: boolean;
  auth_type: string;
  auth_config: Record<string, unknown> | null;
  conditions: Record<string, unknown> | null;
  response_actions: Record<string, unknown> | null;
  user_id: string;
  agent_id: string | null;
}

interface AgentTool {
  id: string;
  name: string;
  description: string;
  endpoint_url: string | null;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  headers: Record<string, string> | null;
  timeout_ms: number | null;
  enabled: boolean;
  agent_id: string;
}

interface MigrationResult {
  success: boolean;
  automationId?: string;
  error?: string;
  originalId: string;
  originalType: "webhook" | "tool";
  name: string;
}

// ============================================
// WEBHOOK MIGRATION
// ============================================

/**
 * Map webhook events to automation trigger events
 */
function mapWebhookEventToTrigger(events: string[] | null): { event: string } {
  if (!events || events.length === 0) {
    return { event: "lead.created" };
  }
  
  // Map legacy event names to new format
  const eventMapping: Record<string, string> = {
    "lead_created": "lead.created",
    "lead_updated": "lead.updated",
    "lead_stage_changed": "lead.stage_changed",
    "conversation_created": "conversation.created",
    "conversation_closed": "conversation.closed",
    "message_received": "message.received",
    "booking_created": "booking.created",
  };
  
  const mappedEvent = eventMapping[events[0]] || events[0];
  return { event: mappedEvent };
}

/**
 * Convert webhook headers to HTTP node format
 */
function convertHeaders(headers: Record<string, string> | null): Array<{ key: string; value: string; enabled: boolean }> {
  if (!headers) return [];
  return Object.entries(headers).map(([key, value]) => ({
    key,
    value,
    enabled: true,
  }));
}

/**
 * Migrate a single webhook to an automation
 */
export async function migrateWebhookToAutomation(
  webhook: Webhook,
  agentId: string
): Promise<MigrationResult> {
  const triggerNodeId = `trigger-${nanoid(8)}`;
  const httpNodeId = `action-${nanoid(8)}`;
  
  // Create trigger node
  const triggerNode: AutomationNode = {
    id: triggerNodeId,
    type: "trigger-event",
    position: { x: 250, y: 100 },
    data: {
      label: "Event Trigger",
      ...mapWebhookEventToTrigger(webhook.events),
    },
  };
  
  // Create HTTP action node
  const httpNode: AutomationNode = {
    id: httpNodeId,
    type: "action-http",
    position: { x: 250, y: 250 },
    data: {
      label: "HTTP Request",
      method: webhook.method || "POST",
      url: webhook.url,
      headers: convertHeaders(webhook.headers),
      bodyType: "json",
      body: JSON.stringify({ event: "{{trigger.event}}", data: "{{trigger}}" }, null, 2),
      retryOnFailure: true,
      maxRetries: 3,
    },
  };
  
  // Create edge connecting trigger to HTTP
  const edge: AutomationEdge = {
    id: `edge-${nanoid(8)}`,
    source: triggerNodeId,
    target: httpNodeId,
  };
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from("automations")
      .insert({
        name: `[Migrated] ${webhook.name}`,
        description: `Migrated from webhook: ${webhook.id}`,
        trigger_type: "event",
        trigger_config: mapWebhookEventToTrigger(webhook.events),
        nodes: [triggerNode, httpNode],
        edges: [edge],
        agent_id: agentId,
        user_id: webhook.user_id,
        status: "draft",
        enabled: false,
      } as any)
      .select()
      .single());
    
    if (error) throw error;
    
    return {
      success: true,
      automationId: data.id,
      originalId: webhook.id,
      originalType: "webhook",
      name: webhook.name,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      originalId: webhook.id,
      originalType: "webhook",
      name: webhook.name,
    };
  }
}

// ============================================
// AGENT TOOL MIGRATION
// ============================================

/**
 * Migrate a single agent tool to an automation
 */
export async function migrateToolToAutomation(
  tool: AgentTool,
  userId: string
): Promise<MigrationResult> {
  const triggerNodeId = `trigger-${nanoid(8)}`;
  const httpNodeId = `action-${nanoid(8)}`;
  
  // Create AI tool trigger node
  const triggerNode: AutomationNode = {
    id: triggerNodeId,
    type: "trigger-ai-tool",
    position: { x: 250, y: 100 },
    data: {
      label: "AI Tool Trigger",
      toolName: tool.name,
      toolDescription: tool.description,
      parameters: tool.parameters || [],
    },
  };
  
  // Create HTTP action node if endpoint exists
  const nodes: AutomationNode[] = [triggerNode];
  const edges: AutomationEdge[] = [];
  
  if (tool.endpoint_url) {
    const httpNode: AutomationNode = {
      id: httpNodeId,
      type: "action-http",
      position: { x: 250, y: 250 },
      data: {
        label: "HTTP Request",
        method: "POST",
        url: tool.endpoint_url,
        headers: convertHeaders(tool.headers),
        bodyType: "json",
        body: JSON.stringify({ parameters: "{{trigger}}" }, null, 2),
        timeout: tool.timeout_ms ? Math.floor(tool.timeout_ms / 1000) : 30,
        retryOnFailure: true,
        maxRetries: 2,
      },
    };
    
    nodes.push(httpNode);
    edges.push({
      id: `edge-${nanoid(8)}`,
      source: triggerNodeId,
      target: httpNodeId,
    });
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from("automations")
      .insert({
        name: `[Migrated] ${tool.name}`,
        description: `Migrated from agent tool: ${tool.description}`,
        trigger_type: "ai_tool",
        trigger_config: {
          toolName: tool.name,
          toolDescription: tool.description,
          parameters: tool.parameters || [],
        },
        nodes,
        edges,
        agent_id: tool.agent_id,
        user_id: userId,
        status: "draft",
        enabled: false,
      } as any)
      .select()
      .single());
    
    if (error) throw error;
    
    return {
      success: true,
      automationId: data.id,
      originalId: tool.id,
      originalType: "tool",
      name: tool.name,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      originalId: tool.id,
      originalType: "tool",
      name: tool.name,
    };
  }
}

// ============================================
// BATCH MIGRATION
// ============================================

/**
 * Migrate all webhooks for an agent
 */
export async function migrateAllWebhooks(
  agentId: string
): Promise<MigrationResult[]> {
  const { data: webhooks, error } = await supabase
    .from("webhooks")
    .select("*")
    .eq("agent_id", agentId);
  
  if (error) {
    console.error("Failed to fetch webhooks:", error);
    return [];
  }
  
  const results: MigrationResult[] = [];
  for (const webhook of webhooks as Webhook[]) {
    const result = await migrateWebhookToAutomation(webhook, agentId);
    results.push(result);
  }
  
  return results;
}

/**
 * Migrate all agent tools for an agent
 */
export async function migrateAllTools(
  agentId: string,
  userId: string
): Promise<MigrationResult[]> {
  const { data: tools, error } = await supabase
    .from("agent_tools")
    .select("*")
    .eq("agent_id", agentId);
  
  if (error) {
    console.error("Failed to fetch agent tools:", error);
    return [];
  }
  
  const results: MigrationResult[] = [];
  for (const tool of tools as unknown as AgentTool[]) {
    const result = await migrateToolToAutomation(tool, userId);
    results.push(result);
  }
  
  return results;
}

/**
 * Check if there are items to migrate
 */
export async function getMigrationCounts(agentId: string): Promise<{
  webhooks: number;
  tools: number;
}> {
  const [webhooksResult, toolsResult] = await Promise.all([
    supabase
      .from("webhooks")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId),
    supabase
      .from("agent_tools")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId),
  ]);
  
  return {
    webhooks: webhooksResult.count || 0,
    tools: toolsResult.count || 0,
  };
}
