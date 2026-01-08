/**
 * ActionSupabaseNode Component
 * 
 * Database query action node for Supabase operations.
 * 
 * @module components/automations/nodes/ActionSupabaseNode
 */

import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Database02 } from '@untitledui/icons';
import { BaseNode } from './BaseNode';
import type { ActionSupabaseNodeData } from '@/types/automations';

export const ActionSupabaseNode = memo(function ActionSupabaseNode(props: NodeProps) {
  const data = props.data as ActionSupabaseNodeData;
  
  return (
    <BaseNode
      nodeProps={props}
      icon={<Database02 size={16} className="text-white" aria-hidden="true" />}
      colorClass="bg-emerald-500"
      category="Action"
      hasInput={true}
      hasOutput={true}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono text-2xs uppercase">
            {data.operation || 'SELECT'}
          </span>
          <span className="truncate text-foreground">
            {data.table || 'No table set'}
          </span>
        </div>
        {data.responseVariable && (
          <div className="text-2xs text-muted-foreground">
            → {data.responseVariable}
          </div>
        )}
      </div>
    </BaseNode>
  );
});
