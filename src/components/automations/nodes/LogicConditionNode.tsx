/**
 * LogicConditionNode Component
 * 
 * Represents a conditional branch node in the automation flow.
 * Displays the condition configuration for visual reference.
 * Has TWO output handles: "true" (Yes) and "false" (No) for branching.
 * 
 * Uses BaseNode for consistent styling but overrides output handles.
 * 
 * @module components/automations/nodes/LogicConditionNode
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch01, AlertCircle } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { useAutomationValidation } from '@/hooks/useAutomationValidation';
import type { LogicConditionNodeData, BaseNodeData } from '@/types/automations';

const OPERATOR_LABELS: Record<string, string> = {
  equals: '=',
  not_equals: '≠',
  greater_than: '>',
  less_than: '<',
  contains: 'contains',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

export const LogicConditionNode = memo(function LogicConditionNode(props: NodeProps) {
  const { selected, id } = props;
  const data = props.data as LogicConditionNodeData;
  const baseData = props.data as BaseNodeData;
  const { hasNodeErrors, getNodeErrors } = useAutomationValidation();
  
  const nodeHasErrors = hasNodeErrors(id);
  const errors = getNodeErrors(id);

  return (
    <div
      className={cn(
        'min-w-[200px] rounded-lg border bg-card shadow-sm relative',
        'transition-all duration-150',
        nodeHasErrors
          ? 'border-destructive ring-1 ring-destructive/20'
          : selected 
            ? 'border-primary ring-2 ring-primary/20' 
            : 'border-border hover:border-border/80',
        baseData.disabled && 'opacity-50'
      )}
    >
      {/* Validation error indicator */}
      {nodeHasErrors && (
        <div 
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center shadow-sm"
          title={errors.map(e => e.message).join(', ')}
        >
          <AlertCircle size={12} className="text-destructive-foreground" aria-hidden="true" />
        </div>
      )}
      
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />
      
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className="w-8 h-8 rounded-md flex items-center justify-center bg-orange-500">
          <GitBranch01 size={16} className="text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            Decide
          </div>
          <div className="text-sm font-medium text-foreground truncate">
            {baseData.label}
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-3 text-xs text-muted-foreground">
        {data.condition ? (
          <div className="font-mono text-xs">
            {data.condition.field} {OPERATOR_LABELS[data.condition.operator] || data.condition.operator}{' '}
            {data.condition.value !== undefined && String(data.condition.value)}
          </div>
        ) : (
          <div className="text-muted-foreground italic">Configure condition...</div>
        )}
      </div>
      
      {/* Dual Output handles: Yes (left) and No (right) */}
      <div className="relative h-4">
        {/* Yes/True handle - left side */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          className="!w-3 !h-3 !bg-status-active !border-2 !border-background !left-[25%]"
        />
        <span className="absolute left-[25%] -translate-x-1/2 top-0 text-2xs text-status-active-foreground font-medium pointer-events-none">
          Yes
        </span>
        
        {/* No/False handle - right side */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          className="!w-3 !h-3 !bg-destructive !border-2 !border-background !left-[75%]"
        />
        <span className="absolute left-[75%] -translate-x-1/2 top-0 text-2xs text-destructive font-medium pointer-events-none">
          No
        </span>
      </div>
    </div>
  );
});
