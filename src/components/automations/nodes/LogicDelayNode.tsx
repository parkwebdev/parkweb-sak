/**
 * LogicDelayNode Component
 * 
 * Represents a delay/wait node in the automation flow.
 * Displays the configured delay duration.
 * 
 * @module components/automations/nodes/LogicDelayNode
 */

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Clock } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { LogicDelayNodeData } from '@/types/automations';

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

export const LogicDelayNode = memo(function LogicDelayNode(props: NodeProps) {
  const data = props.data as LogicDelayNodeData;

  return (
    <BaseNode
      nodeProps={props}
      icon={<Clock size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-slate-500"
      category="Decide"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground font-medium">
          Wait {formatDuration(data.delayMs || 0)}
        </span>
        {data.delayDescription && (
          <span className="text-muted-foreground">
            ({data.delayDescription})
          </span>
        )}
      </div>
    </BaseNode>
  );
});
