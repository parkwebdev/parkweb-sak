/**
 * ConditionalEdge Component
 * 
 * Custom edge for condition nodes that displays Yes/No labels.
 * Uses React Flow's EdgeLabelRenderer for proper label positioning.
 * 
 * @module components/automations/edges/ConditionalEdge
 */

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/lib/utils';

export const ConditionalEdge = memo(function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  style,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Determine if this is the "true" (Yes) or "false" (No) branch
  const isTrue = sourceHandleId === 'true';
  const label = isTrue ? 'Yes' : 'No';
  
  // Color based on branch type
  const edgeColor = isTrue 
    ? 'hsl(var(--status-active))' 
    : 'hsl(var(--destructive))';
  
  const labelColorClass = isTrue 
    ? 'text-status-active-foreground bg-status-active/10 border-status-active/30' 
    : 'text-destructive bg-destructive/10 border-destructive/30';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            'px-2 py-0.5 text-xs font-medium rounded border shadow-sm',
            'pointer-events-none select-none',
            labelColorClass
          )}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
