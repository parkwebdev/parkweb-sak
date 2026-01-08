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

// Node type registry for React Flow
import { TriggerEventNode } from './TriggerEventNode';
import { TriggerScheduleNode } from './TriggerScheduleNode';
import { TriggerManualNode } from './TriggerManualNode';
import { TriggerAIToolNode } from './TriggerAIToolNode';

export const nodeTypes = {
  'trigger-event': TriggerEventNode,
  'trigger-schedule': TriggerScheduleNode,
  'trigger-manual': TriggerManualNode,
  'trigger-ai-tool': TriggerAIToolNode,
} as const;
