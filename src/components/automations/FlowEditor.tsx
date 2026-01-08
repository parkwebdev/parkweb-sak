/**
 * FlowEditor Component
 * 
 * React Flow canvas for the automation builder.
 * Uses Zustand store for state management.
 * 
 * @module components/automations/FlowEditor
 */

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '@/stores/automationFlowStore';

export function FlowEditor() {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setViewport,
  } = useFlowStore();

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onViewportChange={setViewport}
        fitView
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} size={1} />
        <Controls 
          showZoom
          showFitView
          showInteractive={false}
          className="!bg-card !border-border !shadow-sm"
        />
        <MiniMap 
          className="!bg-card !border-border"
          nodeColor="hsl(var(--primary))"
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
