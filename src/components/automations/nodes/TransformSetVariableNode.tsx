/**
 * TransformSetVariableNode Component
 * 
 * Transform node for setting custom variables with expressions.
 * Variables can be used in subsequent automation steps.
 * 
 * @module components/automations/nodes/TransformSetVariableNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Variable } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { TransformSetVariableNodeData } from '@/types/automations';

export const TransformSetVariableNode = memo(function TransformSetVariableNode(props: NodeProps) {
  const data = props.data as TransformSetVariableNodeData;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Variable size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-amber-500"
      hasInput={true}
      hasOutput={true}
      category="Transform"
    >
      <div className="space-y-1">
        {data.variableName ? (
          <>
            <div className="text-xs font-mono text-foreground">
              {data.variableName}
            </div>
            {data.valueExpression && (
              <div className="text-2xs text-muted-foreground line-clamp-1">
                = {data.valueExpression.length > 40 
                    ? `${data.valueExpression.slice(0, 40)}...` 
                    : data.valueExpression}
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground italic">
            Configure variable...
          </div>
        )}
      </div>
    </BaseNode>
  );
});
