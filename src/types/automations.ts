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
 * Trigger event node configuration.
 */
export interface TriggerEventNodeData extends BaseNodeData {
  /** Source of the event (lead, conversation, booking) */
  eventSource: 'lead' | 'conversation' | 'booking';
  /** Type of event (INSERT, UPDATE, DELETE, any) */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'any';
  /** Optional field-level conditions */
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'changed_to';
    value: unknown;
  }>;
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
  /** Description of what this manual trigger does */
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
 * Set variable transform node configuration.
 */
export interface TransformSetVariableNodeData extends BaseNodeData {
  /** Variable name to set */
  variableName: string;
  /** Value expression (can reference other variables) */
  valueExpression: string;
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
  | LogicConditionNodeData
  | LogicDelayNodeData
  | TransformSetVariableNodeData;

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
        defaultData: { label: 'Event Trigger' },
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
        label: 'AI Tool',
        description: 'Called by the AI agent',
        icon: 'Sparkles',
        color: 'purple',
        defaultData: { label: 'AI Tool' },
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
];
