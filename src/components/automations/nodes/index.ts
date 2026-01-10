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
export { LogicConditionNode } from './LogicConditionNode';
export { LogicDelayNode } from './LogicDelayNode';
export { LogicStopNode } from './LogicStopNode';
export { AIGenerateNode } from './AIGenerateNode';
export { AIClassifyNode } from './AIClassifyNode';
export { AIExtractNode } from './AIExtractNode';
export { TransformSetVariableNode } from './TransformSetVariableNode';

// Node type registry for React Flow
import { TriggerEventNode } from './TriggerEventNode';
import { TriggerScheduleNode } from './TriggerScheduleNode';
import { TriggerManualNode } from './TriggerManualNode';
import { TriggerAIToolNode } from './TriggerAIToolNode';
import { ActionHttpNode } from './ActionHttpNode';
import { ActionEmailNode } from './ActionEmailNode';
import { ActionUpdateLeadNode } from './ActionUpdateLeadNode';
import { LogicConditionNode } from './LogicConditionNode';
import { LogicDelayNode } from './LogicDelayNode';
import { LogicStopNode } from './LogicStopNode';
import { AIGenerateNode } from './AIGenerateNode';
import { AIClassifyNode } from './AIClassifyNode';
import { AIExtractNode } from './AIExtractNode';
import { TransformSetVariableNode } from './TransformSetVariableNode';

export const nodeTypes = {
  'trigger-event': TriggerEventNode,
  'trigger-schedule': TriggerScheduleNode,
  'trigger-manual': TriggerManualNode,
  'trigger-ai-tool': TriggerAIToolNode,
  'action-http': ActionHttpNode,
  'action-email': ActionEmailNode,
  'action-update-lead': ActionUpdateLeadNode,
  'logic-condition': LogicConditionNode,
  'logic-delay': LogicDelayNode,
  'logic-stop': LogicStopNode,
  'ai-generate': AIGenerateNode,
  'ai-classify': AIClassifyNode,
  'ai-extract': AIExtractNode,
  'transform-set-variable': TransformSetVariableNode,
} as const;
