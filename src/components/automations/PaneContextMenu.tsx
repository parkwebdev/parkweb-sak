/**
 * Pane Context Menu Component
 * 
 * Right-click context menu for the empty canvas area.
 * Provides actions like adding nodes and fit view.
 * 
 * @module components/automations/PaneContextMenu
 */

import { memo, useCallback } from 'react';
import { Plus, Maximize02, Grid01 } from '@untitledui/icons';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '@/stores/automationFlowStore';
import { NODE_CATEGORIES, type AutomationNodeType } from '@/types/automations';

interface PaneContextMenuProps {
  /** Screen position for menu */
  screenPosition: { x: number; y: number };
  /** Flow position where node should be added */
  flowPosition: { x: number; y: number };
  /** Callback when menu should close */
  onClose: () => void;
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

/**
 * Context menu that appears on right-click on empty canvas.
 */
export const PaneContextMenu = memo(function PaneContextMenu({
  screenPosition,
  flowPosition,
  onClose,
}: PaneContextMenuProps) {
  const { addNode, selectAllNodes } = useFlowStore();
  const { fitView } = useReactFlow();

  const handleAddNode = useCallback((type: AutomationNodeType) => {
    const defaultData = getDefaultNodeData(type);
    addNode(type, flowPosition, defaultData);
    onClose();
  }, [addNode, flowPosition, onClose]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
    onClose();
  }, [fitView, onClose]);

  const handleSelectAll = useCallback(() => {
    selectAllNodes();
    onClose();
  }, [selectAllNodes, onClose]);

  // Calculate position to keep menu in viewport
  const menuStyle = {
    position: 'fixed' as const,
    top: screenPosition.y,
    left: screenPosition.x,
    zIndex: 50,
  };

  return (
    <>
      {/* Backdrop to close menu on click outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Menu */}
      <div
        style={menuStyle}
        className="min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      >
        {/* Add Node submenu categories */}
        {NODE_CATEGORIES.map((category) => (
          <div key={category.id} className="relative">
            <div className="px-2 py-1 text-2xs font-semibold text-muted-foreground">
              {category.label}
            </div>
            {category.nodes.slice(0, 3).map((node) => (
              <button
                key={node.type}
                onClick={() => handleAddNode(node.type)}
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <Plus className="mr-2 h-3 w-3" aria-hidden="true" />
                {node.label}
              </button>
            ))}
          </div>
        ))}

        <div className="-mx-1 my-1 h-px bg-border" />

        <button
          onClick={handleSelectAll}
          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <Grid01 className="mr-2 h-3 w-3" aria-hidden="true" />
          Select All
          <span className="ml-auto text-2xs tracking-widest text-muted-foreground">
            ⌘A
          </span>
        </button>

        <button
          onClick={handleFitView}
          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <Maximize02 className="mr-2 h-3 w-3" aria-hidden="true" />
          Fit View
        </button>
      </div>
    </>
  );
});
