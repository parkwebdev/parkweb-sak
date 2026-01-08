/**
 * Automation Types
 * Shared types for automation execution engine.
 * 
 * @module _shared/automation/types
 */

// ============================================
// EXECUTION TYPES
// ============================================

export interface ExecutionContext {
  /** Automation ID being executed */
  automationId: string;
  /** Current execution ID */
  executionId: string;
  /** Agent ID */
  agentId: string;
  /** User/account owner ID */
  userId: string;
  /** Trigger type that started execution */
  triggerType: 'event' | 'schedule' | 'manual' | 'ai_tool';
  /** Data from the trigger */
  triggerData: Record<string, unknown>;
  /** Optional conversation ID for AI tool triggers */
  conversationId?: string;
  /** Optional lead ID */
  leadId?: string;
  /** Variables accumulated during execution */
  variables: Record<string, unknown>;
  /** Test mode - don't persist side effects */
  testMode: boolean;
  /** Nodes that have been executed */
  nodesExecuted: NodeExecutionResult[];
  /** Start time for duration tracking */
  startTime: number;
}

export interface NodeExecutionResult {
  nodeId: string;
  nodeType: string;
  status: 'success' | 'error' | 'skipped';
  output?: unknown;
  error?: string;
  durationMs: number;
  timestamp: string;
}

export interface AutomationNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: {
    conditionLabel?: string;
    variant?: string;
  };
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  agent_id: string;
  enabled: boolean;
  status: 'draft' | 'active' | 'paused' | 'error';
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

// ============================================
// NODE EXECUTOR TYPES
// ============================================

export type NodeExecutor = (
  node: AutomationNode,
  context: ExecutionContext,
  supabase: unknown
) => Promise<NodeExecutorResult>;

export interface NodeExecutorResult {
  success: boolean;
  output?: unknown;
  error?: string;
  /** For condition nodes: which branch to take */
  branch?: 'true' | 'false';
  /** For stop nodes: should halt execution */
  shouldStop?: boolean;
  /** Variables to set in context */
  setVariables?: Record<string, unknown>;
}

// ============================================
// TRIGGER TYPES
// ============================================

export interface TriggerEventConfig {
  event:
    | 'lead.created'
    | 'lead.updated'
    | 'lead.stage_changed'
    | 'conversation.created'
    | 'conversation.closed'
    | 'conversation.human_takeover'
    | 'message.received';
  filters?: Record<string, unknown>;
}

export interface TriggerScheduleConfig {
  cron: string;
  timezone: string;
}

export interface TriggerManualConfig {
  allowedRoles?: string[];
}

export interface TriggerAiToolConfig {
  toolName: string;
  toolDescription: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
}

export type TriggerConfig =
  | TriggerEventConfig
  | TriggerScheduleConfig
  | TriggerManualConfig
  | TriggerAiToolConfig;
