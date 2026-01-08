/**
 * Automation Templates
 * Pre-built automation workflows users can start from.
 * 
 * @module lib/automation-templates
 */

import type { AutomationNode, AutomationEdge, AutomationTriggerType } from "@/types/automations";
import { nanoid } from "nanoid";

// ============================================
// TYPES
// ============================================

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: "lead-management" | "notifications" | "ai-workflows" | "integrations";
  icon: string;
  color: string;
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createNodeId(prefix: string): string {
  return `${prefix}-${nanoid(8)}`;
}

// ============================================
// TEMPLATES
// ============================================

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // Lead Management Templates
  {
    id: "new-lead-email",
    name: "New Lead Email Notification",
    description: "Send an email notification when a new lead is created",
    category: "lead-management",
    icon: "Mail01",
    color: "blue",
    triggerType: "event",
    triggerConfig: { event: "lead.created" },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-event",
        position: { x: 250, y: 50 },
        data: {
          label: "New Lead Created",
          event: "lead.created",
        },
      },
      {
        id: "action-1",
        type: "action-email",
        position: { x: 250, y: 200 },
        data: {
          label: "Send Notification",
          to: "{{lead.assigned_to_email}}",
          subject: "New Lead: {{lead.name}}",
          body: "A new lead has been created.\n\nName: {{lead.name}}\nEmail: {{lead.email}}\nPhone: {{lead.phone}}",
          bodyType: "text",
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "action-1" },
    ],
  },
  {
    id: "lead-stage-update",
    name: "Lead Stage Changed Handler",
    description: "Perform actions when a lead moves to a new stage",
    category: "lead-management",
    icon: "Flag06",
    color: "green",
    triggerType: "event",
    triggerConfig: { event: "lead.stage_changed" },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-event",
        position: { x: 250, y: 50 },
        data: {
          label: "Stage Changed",
          event: "lead.stage_changed",
        },
      },
      {
        id: "condition-1",
        type: "logic-condition",
        position: { x: 250, y: 200 },
        data: {
          label: "Check New Stage",
          conditions: [
            {
              field: "{{trigger.new_stage}}",
              operator: "equals",
              value: "qualified",
            },
          ],
          logic: "and",
        },
      },
      {
        id: "action-1",
        type: "action-email",
        position: { x: 100, y: 350 },
        data: {
          label: "Send Qualified Email",
          to: "sales@example.com",
          subject: "Lead Qualified: {{lead.name}}",
          body: "A lead has been qualified and is ready for follow-up.",
          bodyType: "text",
        },
      },
      {
        id: "action-2",
        type: "action-update-lead",
        position: { x: 400, y: 350 },
        data: {
          label: "Update Priority",
          fields: [
            { field: "priority", value: "high", type: "string" },
          ],
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "condition-1" },
      { id: "edge-2", source: "condition-1", target: "action-1", sourceHandle: "true" },
      { id: "edge-3", source: "condition-1", target: "action-2", sourceHandle: "false" },
    ],
  },
  
  // AI Workflow Templates
  {
    id: "ai-lead-classification",
    name: "AI Lead Classification",
    description: "Automatically classify and score new leads using AI",
    category: "ai-workflows",
    icon: "Stars02",
    color: "purple",
    triggerType: "event",
    triggerConfig: { event: "lead.created" },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-event",
        position: { x: 250, y: 50 },
        data: {
          label: "New Lead",
          event: "lead.created",
        },
      },
      {
        id: "ai-1",
        type: "ai-classify",
        position: { x: 250, y: 200 },
        data: {
          label: "Classify Lead",
          inputVariable: "lead",
          categories: [
            { name: "hot", description: "High intent, ready to buy" },
            { name: "warm", description: "Interested but needs nurturing" },
            { name: "cold", description: "Low intent or just browsing" },
          ],
          outputVariable: "classification",
        },
      },
      {
        id: "action-1",
        type: "action-update-lead",
        position: { x: 250, y: 350 },
        data: {
          label: "Update Lead Score",
          fields: [
            { field: "data.ai_classification", value: "{{classification.category}}", type: "string" },
            { field: "data.ai_confidence", value: "{{classification.confidence}}", type: "number" },
          ],
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "ai-1" },
      { id: "edge-2", source: "ai-1", target: "action-1" },
    ],
  },
  {
    id: "ai-response-generator",
    name: "AI Response Generator",
    description: "Generate contextual AI responses as a callable tool",
    category: "ai-workflows",
    icon: "MessageChatCircle",
    color: "indigo",
    triggerType: "ai_tool",
    triggerConfig: {
      toolName: "generate_response",
      toolDescription: "Generate a contextual response for a customer inquiry",
      parameters: [
        { name: "query", type: "string", description: "The customer's question", required: true },
        { name: "context", type: "string", description: "Additional context", required: false },
      ],
    },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-ai-tool",
        position: { x: 250, y: 50 },
        data: {
          label: "AI Tool Trigger",
          toolName: "generate_response",
          toolDescription: "Generate a contextual response for a customer inquiry",
          parameters: [
            { name: "query", type: "string", description: "The customer's question", required: true },
            { name: "context", type: "string", description: "Additional context", required: false },
          ],
        },
      },
      {
        id: "ai-1",
        type: "ai-generate",
        position: { x: 250, y: 200 },
        data: {
          label: "Generate Response",
          prompt: "Based on the following question and context, generate a helpful response.\n\nQuestion: {{trigger.query}}\nContext: {{trigger.context}}\n\nProvide a clear, concise, and helpful response.",
          model: "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 500,
          outputVariable: "response",
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "ai-1" },
    ],
  },
  
  // Integration Templates
  {
    id: "webhook-integration",
    name: "Webhook Integration",
    description: "Send data to an external webhook when events occur",
    category: "integrations",
    icon: "Link01",
    color: "orange",
    triggerType: "event",
    triggerConfig: { event: "lead.created" },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-event",
        position: { x: 250, y: 50 },
        data: {
          label: "Event Trigger",
          event: "lead.created",
        },
      },
      {
        id: "action-1",
        type: "action-http",
        position: { x: 250, y: 200 },
        data: {
          label: "Send to Webhook",
          method: "POST",
          url: "https://your-webhook-url.com/endpoint",
          headers: [
            { key: "Content-Type", value: "application/json", enabled: true },
          ],
          bodyType: "json",
          body: JSON.stringify({
            event: "{{trigger.event}}",
            lead: "{{lead}}",
            timestamp: "{{env.timestamp}}",
          }, null, 2),
          retryOnFailure: true,
          maxRetries: 3,
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "action-1" },
    ],
  },
  {
    id: "crm-sync",
    name: "CRM Sync",
    description: "Sync lead data to an external CRM system",
    category: "integrations",
    icon: "RefreshCw05",
    color: "teal",
    triggerType: "event",
    triggerConfig: { event: "lead.updated" },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-event",
        position: { x: 250, y: 50 },
        data: {
          label: "Lead Updated",
          event: "lead.updated",
        },
      },
      {
        id: "transform-1",
        type: "transform-set-variable",
        position: { x: 250, y: 200 },
        data: {
          label: "Prepare CRM Payload",
          variableName: "crm_payload",
          value: JSON.stringify({
            external_id: "{{lead.id}}",
            name: "{{lead.name}}",
            email: "{{lead.email}}",
            phone: "{{lead.phone}}",
            company: "{{lead.company}}",
            status: "{{lead.status}}",
          }),
          valueType: "json",
        },
      },
      {
        id: "action-1",
        type: "action-http",
        position: { x: 250, y: 350 },
        data: {
          label: "Update CRM",
          method: "PUT",
          url: "https://your-crm.com/api/contacts/{{lead.id}}",
          headers: [
            { key: "Content-Type", value: "application/json", enabled: true },
            { key: "Authorization", value: "Bearer YOUR_API_KEY", enabled: true },
          ],
          bodyType: "json",
          body: "{{crm_payload}}",
          retryOnFailure: true,
          maxRetries: 2,
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "transform-1" },
      { id: "edge-2", source: "transform-1", target: "action-1" },
    ],
  },
  
  // Notification Templates
  {
    id: "takeover-alert",
    name: "Human Takeover Alert",
    description: "Notify team when AI hands off to a human",
    category: "notifications",
    icon: "AlertCircle",
    color: "red",
    triggerType: "event",
    triggerConfig: { event: "conversation.human_takeover" },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-event",
        position: { x: 250, y: 50 },
        data: {
          label: "Takeover Requested",
          event: "conversation.human_takeover",
        },
      },
      {
        id: "action-1",
        type: "action-email",
        position: { x: 250, y: 200 },
        data: {
          label: "Alert Team",
          to: "support@example.com",
          subject: "🚨 Human Takeover Required",
          body: "A conversation requires human attention.\n\nConversation ID: {{conversation.id}}\nLead: {{lead.name}}\nReason: {{trigger.reason}}",
          bodyType: "text",
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "action-1" },
    ],
  },
  {
    id: "daily-summary",
    name: "Daily Summary Report",
    description: "Send a daily summary of activity",
    category: "notifications",
    icon: "Calendar",
    color: "sky",
    triggerType: "schedule",
    triggerConfig: {
      cron: "0 9 * * *",
      timezone: "America/New_York",
    },
    nodes: [
      {
        id: "trigger-1",
        type: "trigger-schedule",
        position: { x: 250, y: 50 },
        data: {
          label: "Daily at 9 AM",
          schedule: "0 9 * * *",
          timezone: "America/New_York",
        },
      },
      {
        id: "action-1",
        type: "action-http",
        position: { x: 250, y: 200 },
        data: {
          label: "Fetch Stats",
          method: "GET",
          url: "{{env.app_url}}/api/stats/daily",
          headers: [
            { key: "Authorization", value: "Bearer {{env.internal_key}}", enabled: true },
          ],
          outputVariable: "stats",
        },
      },
      {
        id: "action-2",
        type: "action-email",
        position: { x: 250, y: 350 },
        data: {
          label: "Send Summary",
          to: "team@example.com",
          subject: "Daily Activity Summary - {{env.timestamp}}",
          body: "Here is your daily summary:\n\n{{stats}}",
          bodyType: "text",
        },
      },
    ],
    edges: [
      { id: "edge-1", source: "trigger-1", target: "action-1" },
      { id: "edge-2", source: "action-1", target: "action-2" },
    ],
  },
];

// ============================================
// TEMPLATE UTILITIES
// ============================================

/**
 * Get all available templates
 */
export function getTemplates(): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: AutomationTemplate["category"]): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((t) => t.id === id);
}

/**
 * Create a new automation from a template with unique IDs
 */
export function instantiateTemplate(template: AutomationTemplate): {
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  triggerType: AutomationTriggerType;
  triggerConfig: Record<string, unknown>;
} {
  // Create a mapping of old IDs to new IDs
  const idMap = new Map<string, string>();
  
  // Generate new IDs for all nodes
  const nodes = template.nodes.map((node) => {
    const newId = createNodeId(node.type);
    idMap.set(node.id, newId);
    return {
      ...node,
      id: newId,
    };
  });
  
  // Update edges with new IDs
  const edges = template.edges.map((edge) => ({
    ...edge,
    id: `edge-${nanoid(8)}`,
    source: idMap.get(edge.source) || edge.source,
    target: idMap.get(edge.target) || edge.target,
  }));
  
  return {
    nodes,
    edges,
    triggerType: template.triggerType,
    triggerConfig: template.triggerConfig,
  };
}

/**
 * Get template categories with counts
 */
export function getTemplateCategories(): Array<{
  id: AutomationTemplate["category"];
  name: string;
  count: number;
}> {
  const categories: Array<{ id: AutomationTemplate["category"]; name: string }> = [
    { id: "lead-management", name: "Lead Management" },
    { id: "notifications", name: "Notifications" },
    { id: "ai-workflows", name: "AI Workflows" },
    { id: "integrations", name: "Integrations" },
  ];
  
  return categories.map((cat) => ({
    ...cat,
    count: AUTOMATION_TEMPLATES.filter((t) => t.category === cat.id).length,
  }));
}
