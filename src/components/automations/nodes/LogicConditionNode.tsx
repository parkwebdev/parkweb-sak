/**
 * LogicConditionNode Component
 * 
 * Represents a conditional branch node in the automation flow.
 * Displays the condition configuration for visual reference.
 * 
 * @module components/automations/nodes/LogicConditionNode
 */

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { GitBranch01 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { LogicConditionNodeData } from '@/types/automations';

export const LogicConditionNode = memo(function LogicConditionNode(props: NodeProps) {
  const data = props.data as LogicConditionNodeData;

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      equals: '=',
      not_equals: '≠',
      greater_than: '>',
      less_than: '<',
      contains: 'contains',
      is_empty: 'is empty',
      is_not_empty: 'is not empty',
    };
    return labels[op] || op;
  };

  return (
    <BaseNode
      nodeProps={props}
      icon={<GitBranch01 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-orange-500"
      category="Logic"
    >
      {data.condition ? (
        <div className="font-mono text-xs">
          {data.condition.field} {getOperatorLabel(data.condition.operator)}{' '}
          {data.condition.value !== undefined && String(data.condition.value)}
        </div>
      ) : (
        <div className="text-muted-foreground italic">No condition set</div>
      )}
    </BaseNode>
  );
});
