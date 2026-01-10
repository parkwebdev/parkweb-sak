/**
 * AIExtractNode Component
 * 
 * AI action node for extracting structured data from text.
 * 
 * @module components/automations/nodes/AIExtractNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { FileSearch01 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { AIExtractNodeData, AIExtractField } from '@/types/automations';

export const AIExtractNode = memo(function AIExtractNode(props: NodeProps) {
  const data = props.data as AIExtractNodeData;
  const fieldCount = data.fields?.length || 0;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<FileSearch01 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-violet-500"
      hasInput={true}
      hasOutput={true}
      category="Do"
    >
      <div className="space-y-1">
        {fieldCount > 0 ? (
          <>
            <div className="text-xs text-foreground">
              Extract {fieldCount} field{fieldCount > 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-1">
              {data.fields?.slice(0, 3).map((field: AIExtractField, i: number) => (
                <span 
                  key={i}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs bg-muted font-mono"
                >
                  {field.name}
                </span>
              ))}
              {fieldCount > 3 && (
                <span className="text-2xs text-muted-foreground">
                  +{fieldCount - 3}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground italic">
            Configure fields...
          </div>
        )}
      </div>
    </BaseNode>
  );
});
