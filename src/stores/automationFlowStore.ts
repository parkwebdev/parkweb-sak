/**
 * Automation Flow Store
 * 
 * Zustand store for React Flow state management with undo/redo support.
 * Uses temporal middleware (zundo) for history tracking.
 * 
 * @module stores/automationFlowStore
 */

import { create } from 'zustand';
import { useStore } from 'zustand';
import { temporal } from 'zundo';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Viewport,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import type { AutomationNode, AutomationEdge, AutomationNodeType, AutomationNodeData } from '@/types/automations';

/**
 * Flow state interface.
 */
interface FlowState {
  /** Current nodes in the flow */
  nodes: AutomationNode[];
  /** Current edges in the flow */
  edges: AutomationEdge[];
  /** Current viewport position and zoom */
  viewport: Viewport;
  /** Whether the flow has unsaved changes */
  isDirty: boolean;
}

/**
 * Flow actions interface.
 */
interface FlowActions {
  /** Handle node changes from React Flow */
  onNodesChange: (changes: NodeChange<AutomationNode>[]) => void;
  /** Handle edge changes from React Flow */
  onEdgesChange: (changes: EdgeChange<AutomationEdge>[]) => void;
  /** Handle new connections from React Flow */
  onConnect: (connection: Connection) => void;
  /** Add a new node at position */
  addNode: (type: AutomationNodeType, position: { x: number; y: number }, data?: Partial<AutomationNodeData>) => string;
  /** Delete a node by ID */
  deleteNode: (nodeId: string) => void;
  /** Duplicate a node and return new node ID */
  duplicateNode: (nodeId: string) => string | null;
  /** Toggle node disabled state */
  toggleNodeDisabled: (nodeId: string) => void;
  /** Select all nodes */
  selectAllNodes: () => void;
  /** Deselect all nodes */
  deselectAllNodes: () => void;
  /** Update node data */
  updateNodeData: (nodeId: string, data: Partial<AutomationNodeData>) => void;
  /** Set viewport */
  setViewport: (viewport: Viewport) => void;
  /** Set all nodes */
  setNodes: (nodes: AutomationNode[]) => void;
  /** Set all edges */
  setEdges: (edges: AutomationEdge[]) => void;
  /** Load flow from automation data */
  loadFlow: (nodes: AutomationNode[], edges: AutomationEdge[], viewport?: Viewport) => void;
  /** Reset store to initial state */
  reset: () => void;
  /** Mark as clean (after save) */
  markClean: () => void;
}

type FlowStore = FlowState & FlowActions;

const initialState: FlowState = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  isDirty: false,
};

/**
 * Automation flow store with temporal (undo/redo) support.
 * 
 * @example
 * ```tsx
 * const { nodes, edges, addNode, undo, redo } = useFlowStore();
 * const { undo, redo, canUndo, canRedo } = useFlowHistory();
 * ```
 */
export const useFlowStore = create<FlowStore>()(
  temporal(
    (set, get) => ({
      ...initialState,

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as AutomationNode[],
          isDirty: true,
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges) as AutomationEdge[],
          isDirty: true,
        });
      },

      onConnect: (connection) => {
        set({
          edges: addEdge(
            { ...connection, id: `edge-${nanoid(8)}` },
            get().edges
          ) as AutomationEdge[],
          isDirty: true,
        });
      },

      addNode: (type, position, data = {}) => {
        const id = `node-${nanoid(8)}`;
        const newNode: AutomationNode = {
          id,
          type,
          position,
          data: {
            label: type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            ...data,
          },
        };
        set({
          nodes: [...get().nodes, newNode],
          isDirty: true,
        });
        return id;
      },

      deleteNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== nodeId),
          edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
          isDirty: true,
        });
      },

      duplicateNode: (nodeId) => {
        const node = get().nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        const newId = `node-${nanoid(8)}`;
        const newNode: AutomationNode = {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          selected: true,
        };

        set({
          nodes: [
            ...get().nodes.map((n) => ({ ...n, selected: false })),
            newNode,
          ],
          isDirty: true,
        });
        return newId;
      },

      toggleNodeDisabled: (nodeId) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, disabled: !node.data.disabled } }
              : node
          ),
          isDirty: true,
        });
      },

      selectAllNodes: () => {
        set({
          nodes: get().nodes.map((n) => ({ ...n, selected: true })),
        });
      },

      deselectAllNodes: () => {
        set({
          nodes: get().nodes.map((n) => ({ ...n, selected: false })),
        });
      },

      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          isDirty: true,
        });
      },

      setViewport: (viewport) => {
        set({ viewport });
      },

      setNodes: (nodes) => {
        set({ nodes, isDirty: true });
      },

      setEdges: (edges) => {
        set({ edges, isDirty: true });
      },

      loadFlow: (nodes, edges, viewport) => {
        set({
          nodes,
          edges,
          viewport: viewport ?? { x: 0, y: 0, zoom: 1 },
          isDirty: false,
        });
      },

      reset: () => {
        set(initialState);
      },

      markClean: () => {
        set({ isDirty: false });
      },
    }),
    {
      // Temporal options
      limit: 50, // Max 50 history states
      equality: (a, b) => {
        // Only track node/edge changes, not viewport
        return (
          JSON.stringify(a.nodes) === JSON.stringify(b.nodes) &&
          JSON.stringify(a.edges) === JSON.stringify(b.edges)
        );
      },
    }
  )
);

/**
 * Hook for accessing undo/redo functionality with reactive state.
 * 
 * @example
 * ```tsx
 * const { undo, redo, canUndo, canRedo } = useFlowHistory();
 * ```
 */
export function useFlowHistory() {
  const temporalStore = useFlowStore.temporal;
  const pastStates = useStore(temporalStore, (state) => state.pastStates);
  const futureStates = useStore(temporalStore, (state) => state.futureStates);

  return {
    undo: () => temporalStore.getState().undo(),
    redo: () => temporalStore.getState().redo(),
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    clear: () => temporalStore.getState().clear(),
  };
}
