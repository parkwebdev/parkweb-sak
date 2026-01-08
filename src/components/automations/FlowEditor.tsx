/**
 * FlowEditor Component
 * 
 * React Flow canvas for the automation builder.
 * Uses Zustand store for state management.
 * 
 * @module components/automations/FlowEditor
 */

import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '@/stores/automationFlowStore';
import { nodeTypes } from './nodes';
import { NODE_CATEGORIES, type AutomationNodeType, type AutomationNode, type AutomationEdge } from '@/types/automations';

/**
 * Get default node data for a given node type.
 */
function getDefaultNodeData(type: AutomationNodeType): Record<string, unknown> {
  for (const category of NODE_CATEGORIES) {
    const nodeDef = category.nodes.find((n) => n.type === type);
    if (nodeDef) {
      return {
        label: nodeDef.defaultData.label || nodeDef.label,
        ...nodeDef.defaultData,
      };
    }
  }
  return { label: 'New Node' };
}

export function FlowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<AutomationNode, AutomationEdge> | null>(null);
  
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    setViewport,
    addNode,
  } = useFlowStore();

  // Memoize nodeTypes to prevent React Flow warnings
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as AutomationNodeType;
      if (!type || !reactFlowInstance.current || !reactFlowWrapper.current) {
        return;
      }

      // Get the position relative to the flow canvas
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Get default data for this node type
      const defaultData = getDefaultNodeData(type);

      // Add the new node using the store action
      addNode(type, position, defaultData);
    },
    [addNode]
  );

  const onInit = useCallback((instance: ReactFlowInstance<AutomationNode, AutomationEdge>) => {
    reactFlowInstance.current = instance;
  }, []);

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onViewportChange={setViewport}
        onInit={onInit}
        onDragOver={onDragOver}
        onDrop={onDrop}
        fitView
        className="bg-background"
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 },
          type: 'smoothstep',
        }}
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
