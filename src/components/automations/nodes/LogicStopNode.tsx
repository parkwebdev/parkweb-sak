/**
 * LogicStopNode Component
 * 
 * Represents a stop/end node in the automation flow.
 * Terminates the automation execution at this point.
 * 
 * @module components/automations/nodes/LogicStopNode
 */

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { StopCircle } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { LogicStopNodeData } from '@/types/automations';

export const LogicStopNode = memo(function LogicStopNode(props: NodeProps) {
  const data = props.data as LogicStopNodeData;

  return (
    <BaseNode
      nodeProps={props}
      icon={<StopCircle size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-red-500"
      category="Decide"
      hasOutput={false}
    >
      {data.reason ? (
        <div className="text-muted-foreground">{data.reason}</div>
      ) : (
        <div className="text-muted-foreground italic">End automation</div>
      )}
    </BaseNode>
  );
});
