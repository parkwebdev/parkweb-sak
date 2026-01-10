/**
 * BaseNode Component
 * 
 * Base wrapper for all automation nodes with consistent styling.
 * Handles selection state, disabled state, validation errors, and common layout.
 * 
 * @module components/automations/nodes/BaseNode
 */

import { memo, type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertCircle } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { useAutomationValidation } from '@/hooks/useAutomationValidation';
import type { BaseNodeData } from '@/types/automations';

interface BaseNodeProps {
  /** Node props from React Flow */
  nodeProps: NodeProps;
  /** Icon component to display */
  icon: ReactNode;
  /** Background color class (e.g., 'bg-amber-500') */
  colorClass: string;
  /** Whether this node has an input handle */
  hasInput?: boolean;
  /** Whether this node has an output handle */
  hasOutput?: boolean;
  /** Node category label */
  category: string;
  /** Children content for the node body */
  children?: ReactNode;
}

export const BaseNode = memo(function BaseNode({
  nodeProps,
  icon,
  colorClass,
  hasInput = true,
  hasOutput = true,
  category,
  children,
}: BaseNodeProps) {
  const { selected } = nodeProps;
  const data = nodeProps.data as BaseNodeData;
  const { hasNodeErrors, getNodeErrors } = useAutomationValidation();
  
  const nodeHasErrors = hasNodeErrors(nodeProps.id);
  const errors = getNodeErrors(nodeProps.id);
  
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
        data.disabled && 'opacity-50'
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
      {hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}
      
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <div className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center',
          colorClass
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {category}
          </div>
          <div className="text-sm font-medium text-foreground truncate">
            {data.label}
          </div>
        </div>
      </div>
      
      {/* Body */}
      {children && (
        <div className="p-3 text-xs text-muted-foreground">
          {children}
        </div>
      )}
      
      {/* Output handle */}
      {hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}
    </div>
  );
});
