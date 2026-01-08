/**
 * TriggerAIToolNode Component
 * 
 * Trigger node for AI-initiated automation starts.
 * Exposes the automation as a tool the AI agent can call.
 * 
 * @module components/automations/nodes/TriggerAIToolNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Stars02 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { TriggerAIToolNodeData } from '@/types/automations';

export const TriggerAIToolNode = memo(function TriggerAIToolNode(props: NodeProps) {
  const data = props.data as TriggerAIToolNodeData;
  const paramCount = data.parameters?.length || 0;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Stars02 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-purple-500"
      hasInput={false}
      hasOutput={true}
      category="Trigger"
    >
      <div className="space-y-1">
        {data.toolName ? (
          <>
            <div className="font-mono text-foreground text-xs">
              {data.toolName}
            </div>
            {data.toolDescription && (
              <div className="text-2xs text-muted-foreground line-clamp-2">
                {data.toolDescription}
              </div>
            )}
            {paramCount > 0 && (
              <div className="text-2xs text-muted-foreground">
                {paramCount} parameter{paramCount > 1 ? 's' : ''}
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground italic">
            Configure tool name...
          </div>
        )}
      </div>
    </BaseNode>
  );
});
