/**
 * AIClassifyNode Component
 * 
 * AI action node for classifying input into categories.
 * 
 * @module components/automations/nodes/AIClassifyNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Tag01 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { AIClassifyNodeData, AIClassifyCategory } from '@/types/automations';

export const AIClassifyNode = memo(function AIClassifyNode(props: NodeProps) {
  const data = props.data as AIClassifyNodeData;
  const categoryCount = data.categories?.length || 0;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Tag01 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-violet-500"
      hasInput={true}
      hasOutput={true}
      category="Decide"
    >
      <div className="space-y-1">
        {categoryCount > 0 ? (
          <>
            <div className="text-xs text-foreground">
              {categoryCount} categories
            </div>
            <div className="flex flex-wrap gap-1">
              {data.categories?.slice(0, 3).map((cat: AIClassifyCategory, i: number) => (
                <span 
                  key={i}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs bg-muted text-muted-foreground"
                >
                  {cat.name}
                </span>
              ))}
              {categoryCount > 3 && (
                <span className="text-2xs text-muted-foreground">
                  +{categoryCount - 3}
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground italic">
            Configure categories...
          </div>
        )}
      </div>
    </BaseNode>
  );
});
