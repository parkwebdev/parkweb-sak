/**
 * Automation Type Definitions
 * 
 * Type-safe interfaces for the visual automation system.
 * Includes React Flow node/edge types and trigger configurations.
 * 
 * @module types/automations
 */

import type { Node, Edge, Viewport } from '@xyflow/react';
import type { Tables, Enums } from '@/integrations/supabase/types';

// ============================================================================
// Base Types
// ============================================================================

/**
 * All available automation node types.
 * Organized by category: triggers, actions, logic, transform, AI.
 */
export type AutomationNodeType =
  // Triggers
  | 'trigger-event'
  | 'trigger-schedule'
  | 'trigger-manual'
  | 'trigger-ai-tool'
  // Actions
  | 'action-http'
  | 'action-email'
  | 'action-update-lead'
  | 'action-create-booking'
  | 'action-send-message'
  // Logic
  | 'logic-condition'
  | 'logic-switch'
  | 'logic-loop'
  | 'logic-delay'
  | 'logic-stop'
  // Transform
  | 'transform-set-variable'
  | 'transform-map'
  | 'transform-filter'
  | 'transform-aggregate'
  // AI
  | 'ai-generate'
  | 'ai-classify'
  | 'ai-extract';

/**
 * Automation status values.
 */
export type AutomationStatus = 'draft' | 'active' | 'paused' | 'error';

/**
 * Automation trigger types.
 */
export type AutomationTriggerType = 'event' | 'schedule' | 'manual' | 'ai_tool';

/**
 * Execution status values.
 */
export type AutomationExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// ============================================================================
// Node Data Types
// ============================================================================

/**
 * Base data shared by all automation nodes.
 */
export interface BaseNodeData extends Record<string, unknown> {
  /** Display label for the node */
  label: string;
  /** Optional description */
  description?: string;
  /** Whether the node is disabled */
  disabled?: boolean;
}

/**
 * Supported automation event types matching backend format.
 */
export type AutomationEventType =
  // Lead events
  | 'lead.created'
  | 'lead.updated'
  | 'lead.stage_changed'
  | 'lead.deleted'
  // Conversation events
  | 'conversation.created'
  | 'conversation.closed'
  | 'conversation.human_takeover'
  // Message events
  | 'message.received'
  // Booking events
  | 'booking.created'
  | 'booking.updated'
  | 'booking.cancelled'
  | 'booking.confirmed'
  | 'booking.completed'
  | 'booking.no_show'
  | 'booking.deleted';

/**
 * Trigger event node configuration.
 */
export interface TriggerEventNodeData extends BaseNodeData {
  /** Event type matching backend TriggerEventConfig */
  event?: AutomationEventType;
  /** Optional filters for the event */
  filters?: Record<string, unknown>;
}

/**
 * Trigger schedule node configuration.
 */
export interface TriggerScheduleNodeData extends BaseNodeData {
  /** Cron expression */
  cronExpression: string;
  /** Timezone for the schedule */
  timezone: string;
}

/**
 * Trigger manual node configuration.
 */
export interface TriggerManualNodeData extends BaseNodeData {
  /** Action name shown when triggering this automation */
  buttonLabel?: string;
  /** Whether to require confirmation */
  requireConfirmation?: boolean;
}

/**
 * Trigger AI tool node configuration.
 */
export interface TriggerAIToolNodeData extends BaseNodeData {
  /** Tool name for AI to call */
  toolName: string;
  /** Tool description for AI */
  toolDescription: string;
  /** Parameter schema */
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
    required: boolean;
  }>;
}

/**
 * HTTP action node configuration.
 */
export interface ActionHttpNodeData extends BaseNodeData {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Target URL */
  url: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (for POST/PUT/PATCH) */
  body?: string;
  /** Response variable name */
  responseVariable?: string;
}

/**
 * Email action node configuration.
 */
export interface ActionEmailNodeData extends BaseNodeData {
  /** Recipient email */
  to: string;
  /** Sender name */
  fromName?: string;
  /** Email subject */
  subject: string;
  /** Email body (HTML) */
  body: string;
  /** Reply-to email */
  replyTo?: string;
}

/**
 * Lead field update definition.
 */
export interface LeadFieldUpdate {
  /** Field to update */
  field: string;
  /** New value (can include variable interpolation) */
  value: string;
}

/**
 * Update lead action node configuration.
 */
export interface ActionUpdateLeadNodeData extends BaseNodeData {
  /** Lead ID or variable reference */
  leadId?: string;
  /** Fields to update */
  fields?: LeadFieldUpdate[];
}

/**
 * Supabase database action node configuration.
 */
export interface ActionSupabaseNodeData extends BaseNodeData {
  /** Database operation */
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  /** Target table */
  table: string;
  /** Query filters (for select, update, delete) */
  filters?: Record<string, unknown>;
  /** Data to insert/update */
  data?: Record<string, unknown>;
  /** Columns to select */
  columns?: string;
  /** Variable to store result */
  responseVariable?: string;
}

/**
 * Task creation action node configuration.
 */
export interface ActionTaskNodeData extends BaseNodeData {
  /** Task title */
  taskTitle: string;
  /** Task description */
  taskDescription?: string;
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  /** Assignee email or user ID */
  assignee?: string;
  /** Due date (relative, absolute, or variable) */
  dueDate?: string;
  /** Optional linked lead ID */
  leadId?: string;
}

/**
 * Team notification action node configuration.
 */
export interface ActionNotifyNodeData extends BaseNodeData {
  /** Notification title */
  notificationTitle: string;
  /** Notification message */
  message: string;
  /** Notification type */
  notificationType?: 'info' | 'success' | 'warning' | 'error';
  /** Notification channel */
  channel?: 'in_app' | 'email' | 'both';
  /** Recipients (emails or user IDs) */
  recipients?: string[];
  /** Optional action URL */
  actionUrl?: string;
}

/**
 * Condition logic node configuration.
 */
export interface LogicConditionNodeData extends BaseNodeData {
  /** Condition expression */
  condition: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty' | 'is_not_empty';
    value: unknown;
  };
}

/**
 * Delay logic node configuration.
 */
export interface LogicDelayNodeData extends BaseNodeData {
  /** Delay duration in milliseconds */
  delayMs: number;
  /** Human-readable delay description */
  delayDescription?: string;
}

/**
 * Stop logic node configuration.
 */
export interface LogicStopNodeData extends BaseNodeData {
  /** Optional reason for stopping */
  reason?: string;
}

/**
 * Set variable transform node configuration.
 */
export interface TransformSetVariableNodeData extends BaseNodeData {
  /** Variable name to set */
  variableName: string;
  /** Value expression (can reference other variables) */
  valueExpression: string;
}

// ============================================================================
// AI Node Data Types
// ============================================================================

/**
 * AI generate text node configuration.
 */
export interface AIGenerateNodeData extends BaseNodeData {
  /** Prompt template with variable interpolation */
  prompt: string;
  /** AI model to use */
  model?: string;
  /** Temperature (creativity) */
  temperature?: number;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Output format */
  outputFormat?: 'text' | 'json';
  /** Variable name to store the result */
  outputVariable: string;
}

/**
 * AI classification category.
 */
export interface AIClassifyCategory {
  /** Category name */
  name: string;
  /** Category description for AI */
  description?: string;
}

/**
 * AI classify node configuration.
 */
export interface AIClassifyNodeData extends BaseNodeData {
  /** Input text to classify (variable reference) */
  input: string;
  /** Categories to classify into */
  categories: AIClassifyCategory[];
  /** Variable name to store the result */
  outputVariable: string;
  /** Whether to include confidence score */
  includeConfidence?: boolean;
}

/**
 * AI extraction field definition.
 */
export interface AIExtractField {
  /** Field name */
  name: string;
  /** Field data type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url';
  /** Field description for AI */
  description?: string;
  /** Whether field is required */
  required: boolean;
}

/**
 * AI extract node configuration.
 */
export interface AIExtractNodeData extends BaseNodeData {
  /** Input text to extract from (variable reference) */
  input: string;
  /** Fields to extract */
  fields: AIExtractField[];
  /** Variable name to store the result */
  outputVariable: string;
}

/**
 * Union of all node data types.
 */
export type AutomationNodeData =
  | BaseNodeData
  | TriggerEventNodeData
  | TriggerScheduleNodeData
  | TriggerManualNodeData
  | TriggerAIToolNodeData
  | ActionHttpNodeData
  | ActionEmailNodeData
  | ActionUpdateLeadNodeData
  | ActionSupabaseNodeData
  | ActionTaskNodeData
  | ActionNotifyNodeData
  | LogicConditionNodeData
  | LogicDelayNodeData
  | LogicStopNodeData
  | TransformSetVariableNodeData
  | AIGenerateNodeData
  | AIClassifyNodeData
  | AIExtractNodeData;

// ============================================================================
// React Flow Types
// ============================================================================

/**
 * Automation node with typed data.
 */
export type AutomationNode = Node<AutomationNodeData, AutomationNodeType>;

/**
 * Automation edge with optional condition label.
 */
export interface AutomationEdge extends Edge {
  /** Condition label for branching (e.g., "true", "false") */
  conditionLabel?: string;
  /** Edge style variant */
  variant?: 'default' | 'success' | 'error';
}

// ============================================================================
// Trigger Config Types
// ============================================================================

/**
 * Event trigger configuration stored in trigger_config JSONB.
 */
export interface TriggerEventConfig {
  eventSource: 'lead' | 'conversation' | 'booking';
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'any';
  conditions?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
}

/**
 * Schedule trigger configuration stored in trigger_config JSONB.
 */
export interface TriggerScheduleConfig {
  cronExpression: string;
  timezone: string;
}

/**
 * Manual trigger configuration stored in trigger_config JSONB.
 */
export interface TriggerManualConfig {
  /** Action name shown when triggering this automation */
  buttonLabel?: string;
  requireConfirmation?: boolean;
}

/**
 * AI tool trigger configuration stored in trigger_config JSONB.
 */
export interface TriggerAIToolConfig {
  toolName: string;
  toolDescription: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
    required: boolean;
  }>;
}

/**
 * Union of all trigger config types.
 */
export type AutomationTriggerConfig =
  | TriggerEventConfig
  | TriggerScheduleConfig
  | TriggerManualConfig
  | TriggerAIToolConfig;

// ============================================================================
// Database Record Types
// ============================================================================

/**
 * Automation record from database.
 */
export interface Automation {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  status: AutomationStatus;
  enabled: boolean;
  trigger_type: AutomationTriggerType;
  trigger_config: AutomationTriggerConfig;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  viewport: Viewport;
  execution_count: number;
  last_executed_at: string | null;
  last_execution_status: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Automation list item (without nodes/edges for performance).
 */
export interface AutomationListItem {
  id: string;
  agent_id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  status: AutomationStatus;
  enabled: boolean;
  trigger_type: AutomationTriggerType;
  trigger_config: AutomationTriggerConfig;
  execution_count: number;
  last_executed_at: string | null;
  last_execution_status: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Data for creating a new automation.
 */
export interface CreateAutomationData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  trigger_type: AutomationTriggerType;
  trigger_config?: AutomationTriggerConfig;
}

/**
 * Automation execution record from database.
 */
export interface AutomationExecution {
  id: string;
  automation_id: string;
  trigger_type: string;
  trigger_data: Record<string, unknown> | null;
  status: AutomationExecutionStatus;
  nodes_executed: Array<{
    node_id: string;
    started_at: string;
    completed_at: string;
    status: 'success' | 'error';
    output?: unknown;
    error?: string;
  }>;
  variables: Record<string, unknown>;
  error: string | null;
  error_node_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  test_mode: boolean;
  triggered_by: string | null;
  lead_id: string | null;
  conversation_id: string | null;
}

// ============================================================================
// Node Category Configuration
// ============================================================================

/**
 * Node category for sidebar organization.
 */
export interface NodeCategory {
  id: string;
  label: string;
  description: string;
  nodes: NodeDefinition[];
}

/**
 * Node definition for the sidebar.
 */
export interface NodeDefinition {
  type: AutomationNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  /** Default data when node is created */
  defaultData: Partial<AutomationNodeData>;
}

/**
 * All available node categories with their nodes.
 */
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'triggers',
    label: 'Triggers',
    description: 'Start your automation',
    nodes: [
      {
        type: 'trigger-event',
        label: 'Event',
        description: 'Triggered by lead or conversation events',
        icon: 'Zap',
        color: 'amber',
        defaultData: { label: 'Event Trigger', event: 'lead.created' },
      },
      {
        type: 'trigger-schedule',
        label: 'Schedule',
        description: 'Run on a schedule (cron)',
        icon: 'Clock',
        color: 'blue',
        defaultData: { label: 'Scheduled Trigger' },
      },
      {
        type: 'trigger-manual',
        label: 'Manual',
        description: 'Triggered by user action',
        icon: 'Hand',
        color: 'green',
        defaultData: { label: 'Manual Trigger' },
      },
      {
        type: 'trigger-ai-tool',
        label: 'Ari Action',
        description: 'Ari uses this during conversations',
        icon: 'Sparkles',
        color: 'purple',
        defaultData: { label: 'Ari Action' },
      },
    ],
  },
  {
    id: 'actions',
    label: 'Actions',
    description: 'Perform operations',
    nodes: [
      {
        type: 'action-http',
        label: 'HTTP Request',
        description: 'Make an HTTP request',
        icon: 'Globe',
        color: 'blue',
        defaultData: { label: 'HTTP Request', method: 'POST', url: '' },
      },
      {
        type: 'action-email',
        label: 'Send Email',
        description: 'Send an email notification',
        icon: 'Mail',
        color: 'red',
        defaultData: { label: 'Send Email' },
      },
      {
        type: 'action-update-lead',
        label: 'Update Lead',
        description: 'Update lead information',
        icon: 'User',
        color: 'green',
        defaultData: { label: 'Update Lead' },
      },
    ],
  },
  {
    id: 'logic',
    label: 'Logic',
    description: 'Control flow',
    nodes: [
      {
        type: 'logic-condition',
        label: 'Condition',
        description: 'Branch based on a condition',
        icon: 'GitBranch',
        color: 'orange',
        defaultData: { label: 'Condition' },
      },
      {
        type: 'logic-delay',
        label: 'Delay',
        description: 'Wait before continuing',
        icon: 'Timer',
        color: 'gray',
        defaultData: { label: 'Delay', delayMs: 60000 },
      },
      {
        type: 'logic-stop',
        label: 'Stop',
        description: 'End the automation',
        icon: 'StopCircle',
        color: 'red',
        defaultData: { label: 'Stop' },
      },
    ],
  },
  {
    id: 'transform',
    label: 'Transform',
    description: 'Manipulate data',
    nodes: [
      {
        type: 'transform-set-variable',
        label: 'Set Variable',
        description: 'Set a variable value',
        icon: 'Variable',
        color: 'cyan',
        defaultData: { label: 'Set Variable' },
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    description: 'AI-powered actions',
    nodes: [
      {
        type: 'ai-generate',
        label: 'Generate Text',
        description: 'Generate text with AI',
        icon: 'Sparkles',
        color: 'violet',
        defaultData: { label: 'AI Generate', model: 'google/gemini-2.5-flash', outputVariable: 'ai_response' },
      },
      {
        type: 'ai-classify',
        label: 'Classify',
        description: 'Classify input into categories',
        icon: 'Tag',
        color: 'violet',
        defaultData: { label: 'AI Classify', categories: [], outputVariable: 'classification' },
      },
      {
        type: 'ai-extract',
        label: 'Extract Data',
        description: 'Extract structured data from text',
        icon: 'Search',
        color: 'violet',
        defaultData: { label: 'AI Extract', fields: [], outputVariable: 'extracted' },
      },
    ],
  },
];
