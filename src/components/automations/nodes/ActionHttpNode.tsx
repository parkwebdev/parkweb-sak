/**
 * ActionHttpNode Component
 * 
 * HTTP request action node for making API calls.
 * 
 * @module components/automations/nodes/ActionHttpNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Globe02 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { ActionHttpNodeData } from '@/types/automations';

export const ActionHttpNode = memo(function ActionHttpNode(props: NodeProps) {
  const data = props.data as ActionHttpNodeData;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Globe02 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-blue-500"
      category="Action"
      hasInput={true}
      hasOutput={true}
    >
      {data.url ? (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono text-2xs">
              {data.method || 'GET'}
            </span>
            <span className="truncate text-foreground">
              {data.url}
            </span>
          </div>
          {data.responseVariable && (
            <div className="text-2xs text-muted-foreground">
              → {data.responseVariable}
            </div>
          )}
        </div>
      ) : (
        <div className="text-muted-foreground italic">Configure webhook...</div>
      )}
    </BaseNode>
  );
});
