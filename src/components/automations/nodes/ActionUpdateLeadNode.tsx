/**
 * ActionUpdateLeadNode Component
 * 
 * Lead update action node.
 * 
 * @module components/automations/nodes/ActionUpdateLeadNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { User01 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { ActionUpdateLeadNodeData } from '@/types/automations';

export const ActionUpdateLeadNode = memo(function ActionUpdateLeadNode(props: NodeProps) {
  const data = props.data as ActionUpdateLeadNodeData;
  const fieldCount = data.fields?.length || 0;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<User01 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-green-500"
      category="Action"
      hasInput={true}
      hasOutput={true}
    >
      {fieldCount > 0 ? (
        <div className="space-y-1">
          <div className="text-xs text-foreground">
            Update {fieldCount} field{fieldCount !== 1 ? 's' : ''}
          </div>
          <div className="text-2xs text-muted-foreground">
            {data.fields!.slice(0, 2).map(f => f.field).join(', ')}
            {data.fields!.length > 2 && ` +${data.fields!.length - 2} more`}
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground italic">Configure fields...</div>
      )}
    </BaseNode>
  );
});
