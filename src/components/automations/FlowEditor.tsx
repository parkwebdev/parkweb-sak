/**
 * FlowEditor Component
 * 
 * React Flow canvas for the automation builder.
 * Uses Zustand store for state management.
 * Includes context menus, keyboard shortcuts, and custom edge types.
 * 
 * @module components/automations/FlowEditor
 */

import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
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
import { edgeTypes } from './edges';
import { NodeContextMenu } from './NodeContextMenu';
import { PaneContextMenu } from './PaneContextMenu';
import { FlowEmptyState } from './FlowEmptyState';
import { NODE_CATEGORIES, type AutomationNodeType, type AutomationNode, type AutomationEdge } from '@/types/automations';

/** Context menu state for nodes */
interface NodeMenuState {
  nodeId: string;
  nodeType: AutomationNodeType;
  isDisabled: boolean;
  x: number;
  y: number;
}

/** Context menu state for pane */
interface PaneMenuState {
  screenX: number;
  screenY: number;
  flowX: number;
  flowY: number;
}

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
    duplicateNode,
    selectAllNodes,
    deselectAllNodes,
  } = useFlowStore();

  // Context menu states
  const [nodeMenu, setNodeMenu] = useState<NodeMenuState | null>(null);
  const [paneMenu, setPaneMenu] = useState<PaneMenuState | null>(null);

  // Memoize nodeTypes and edgeTypes to prevent React Flow warnings
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  // Close menus
  const closeMenus = useCallback(() => {
    setNodeMenu(null);
    setPaneMenu(null);
  }, []);

  // Node context menu handler
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: AutomationNode) => {
      event.preventDefault();
      setPaneMenu(null); // Close pane menu if open
      
      setNodeMenu({
        nodeId: node.id,
        nodeType: node.type as AutomationNodeType,
        isDisabled: !!node.data.disabled,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  // Pane context menu handler
  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      setNodeMenu(null); // Close node menu if open
      
      const position = reactFlowInstance.current?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      setPaneMenu({
        screenX: event.clientX,
        screenY: event.clientY,
        flowX: position?.x ?? 0,
        flowY: position?.y ?? 0,
      });
    },
    []
  );

  // Close menus on pane click
  const onPaneClick = useCallback(() => {
    closeMenus();
  }, [closeMenus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape - close menus and deselect
      if (event.key === 'Escape') {
        closeMenus();
        deselectAllNodes();
        return;
      }

      // Ctrl/Cmd + D - Duplicate selected node
      if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        const selectedNode = nodes.find((n) => n.selected);
        if (selectedNode) {
          duplicateNode(selectedNode.id);
        }
        return;
      }

      // Ctrl/Cmd + A - Select all nodes
      if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        selectAllNodes();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nodes, duplicateNode, selectAllNodes, deselectAllNodes, closeMenus]);

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

  // Handler for empty state trigger selection
  const handleAddTrigger = useCallback((type: string) => {
    const defaultData = getDefaultNodeData(type as AutomationNodeType);
    // Add trigger node at center of viewport
    const position = { x: 250, y: 100 };
    addNode(type as AutomationNodeType, position, defaultData);
  }, [addNode]);

  const isEmpty = nodes.length === 0;

  return (
    <div className="h-full w-full relative" ref={reactFlowWrapper}>
      {isEmpty && <FlowEmptyState onAddTrigger={handleAddTrigger} />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onViewportChange={setViewport}
        onInit={onInit}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        deleteKeyCode={['Backspace', 'Delete']}
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

      {/* Node Context Menu */}
      {nodeMenu && (
        <NodeContextMenu
          nodeId={nodeMenu.nodeId}
          nodeType={nodeMenu.nodeType}
          position={{ x: nodeMenu.x, y: nodeMenu.y }}
          isDisabled={nodeMenu.isDisabled}
          onClose={() => setNodeMenu(null)}
        />
      )}

      {/* Pane Context Menu */}
      {paneMenu && (
        <PaneContextMenu
          screenPosition={{ x: paneMenu.screenX, y: paneMenu.screenY }}
          flowPosition={{ x: paneMenu.flowX, y: paneMenu.flowY }}
          onClose={() => setPaneMenu(null)}
        />
      )}
    </div>
  );
}
