/**
 * Custom Automation Node Components
 * 
 * Exports all custom node types for the automation flow editor.
 * 
 * @module components/automations/nodes
 */

export { BaseNode } from './BaseNode';
export { TriggerEventNode } from './TriggerEventNode';
export { TriggerScheduleNode } from './TriggerScheduleNode';
export { TriggerManualNode } from './TriggerManualNode';
export { TriggerAIToolNode } from './TriggerAIToolNode';
export { ActionHttpNode } from './ActionHttpNode';
export { ActionEmailNode } from './ActionEmailNode';
export { ActionUpdateLeadNode } from './ActionUpdateLeadNode';
export { ActionSupabaseNode } from './ActionSupabaseNode';
export { ActionTaskNode } from './ActionTaskNode';
export { ActionNotifyNode } from './ActionNotifyNode';

// Node type registry for React Flow
import { TriggerEventNode } from './TriggerEventNode';
import { TriggerScheduleNode } from './TriggerScheduleNode';
import { TriggerManualNode } from './TriggerManualNode';
import { TriggerAIToolNode } from './TriggerAIToolNode';
import { ActionHttpNode } from './ActionHttpNode';
import { ActionEmailNode } from './ActionEmailNode';
import { ActionUpdateLeadNode } from './ActionUpdateLeadNode';
import { ActionSupabaseNode } from './ActionSupabaseNode';
import { ActionTaskNode } from './ActionTaskNode';
import { ActionNotifyNode } from './ActionNotifyNode';

export const nodeTypes = {
  'trigger-event': TriggerEventNode,
  'trigger-schedule': TriggerScheduleNode,
  'trigger-manual': TriggerManualNode,
  'trigger-ai-tool': TriggerAIToolNode,
  'action-http': ActionHttpNode,
  'action-email': ActionEmailNode,
  'action-update-lead': ActionUpdateLeadNode,
  'action-supabase': ActionSupabaseNode,
  'action-task': ActionTaskNode,
  'action-notify': ActionNotifyNode,
} as const;
