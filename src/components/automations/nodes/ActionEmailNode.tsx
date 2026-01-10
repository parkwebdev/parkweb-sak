/**
 * ActionEmailNode Component
 * 
 * Email sending action node.
 * 
 * @module components/automations/nodes/ActionEmailNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Mail01 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { ActionEmailNodeData } from '@/types/automations';

export const ActionEmailNode = memo(function ActionEmailNode(props: NodeProps) {
  const data = props.data as ActionEmailNodeData;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Mail01 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-red-500"
      category="Action"
      hasInput={true}
      hasOutput={true}
    >
      {data.to || data.subject ? (
        <div className="space-y-1">
          <div className="truncate">
            <span className="text-muted-foreground">To: </span>
            <span className="text-foreground">{data.to || 'Not set'}</span>
          </div>
          <div className="truncate">
            <span className="text-muted-foreground">Subject: </span>
            <span className="text-foreground">{data.subject || 'No subject'}</span>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground italic">Configure email...</div>
      )}
    </BaseNode>
  );
});
