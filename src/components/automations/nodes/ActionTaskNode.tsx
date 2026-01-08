/**
 * ActionTaskNode Component
 * 
 * Task creation action node.
 * 
 * @module components/automations/nodes/ActionTaskNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { CheckSquare } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { ActionTaskNodeData } from '@/types/automations';

export const ActionTaskNode = memo(function ActionTaskNode(props: NodeProps) {
  const data = props.data as ActionTaskNodeData;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<CheckSquare size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-violet-500"
      category="Action"
      hasInput={true}
      hasOutput={true}
    >
      <div className="space-y-1">
        <div className="text-foreground truncate">
          {data.taskTitle || 'No title set'}
        </div>
        {data.assignee && (
          <div className="text-2xs text-muted-foreground">
            Assign to: {data.assignee}
          </div>
        )}
      </div>
    </BaseNode>
  );
});
