/**
 * ActionNotifyNode Component
 * 
 * Team notification action node.
 * 
 * @module components/automations/nodes/ActionNotifyNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Bell01 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { ActionNotifyNodeData } from '@/types/automations';

export const ActionNotifyNode = memo(function ActionNotifyNode(props: NodeProps) {
  const data = props.data as ActionNotifyNodeData;
  
  const recipientCount = data.recipients?.length ?? 0;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Bell01 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-orange-500"
      category="Action"
      hasInput={true}
      hasOutput={true}
    >
      <div className="space-y-1">
        <div className="text-foreground truncate">
          {data.notificationTitle || 'No title set'}
        </div>
        <div className="text-2xs text-muted-foreground">
          {recipientCount === 0 && 'No recipients'}
          {recipientCount === 1 && '1 recipient'}
          {recipientCount > 1 && `${recipientCount} recipients`}
        </div>
      </div>
    </BaseNode>
  );
});
