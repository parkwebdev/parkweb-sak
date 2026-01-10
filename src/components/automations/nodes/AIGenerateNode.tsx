/**
 * AIGenerateNode Component
 * 
 * AI action node for generating text using LLM.
 * Supports prompt templates with variable interpolation.
 * 
 * @module components/automations/nodes/AIGenerateNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Stars02 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { AIGenerateNodeData } from '@/types/automations';

export const AIGenerateNode = memo(function AIGenerateNode(props: NodeProps) {
  const data = props.data as AIGenerateNodeData;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Stars02 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-violet-500"
      hasInput={true}
      hasOutput={true}
      category="Do"
    >
      <div className="space-y-1">
        {data.prompt ? (
          <>
            <div className="text-xs text-foreground line-clamp-2">
              {data.prompt.length > 60 ? `${data.prompt.slice(0, 60)}...` : data.prompt}
            </div>
            <div className="flex items-center gap-2 text-2xs text-muted-foreground">
              <span>{data.model || 'gemini-2.5-flash'}</span>
              {data.outputVariable && (
                <span className="font-mono">→ {data.outputVariable}</span>
              )}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground italic">
            Configure prompt...
          </div>
        )}
      </div>
    </BaseNode>
  );
});
