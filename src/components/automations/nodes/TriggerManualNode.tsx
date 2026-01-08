/**
 * TriggerManualNode Component
 * 
 * Trigger node for manual/user-initiated automation starts.
 * Can optionally require confirmation before running.
 * 
 * @module components/automations/nodes/TriggerManualNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Hand } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { TriggerManualNodeData } from '@/types/automations';

export const TriggerManualNode = memo(function TriggerManualNode(props: NodeProps) {
  const data = props.data as TriggerManualNodeData;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Hand size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-green-500"
      hasInput={false}
      hasOutput={true}
      category="Trigger"
    >
      <div className="space-y-1">
        <div className="font-medium text-foreground">
          {data.buttonLabel || 'Run manually'}
        </div>
        {data.requireConfirmation && (
          <div className="text-2xs text-muted-foreground">
            Requires confirmation
          </div>
        )}
      </div>
    </BaseNode>
  );
});
