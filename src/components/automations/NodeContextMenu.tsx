/**
 * Node Context Menu Component
 * 
 * Right-click context menu for automation flow nodes.
 * Provides actions like delete, duplicate, disable, and copy ID.
 * 
 * @module components/automations/NodeContextMenu
 */

import { memo, useCallback } from 'react';
import { Copy01, Trash01, Copy06, SlashCircle01 } from '@untitledui/icons';
import { toast } from 'sonner';
import { useFlowStore } from '@/stores/automationFlowStore';
import type { AutomationNodeType } from '@/types/automations';

interface NodeContextMenuProps {
  /** Node ID to act upon */
  nodeId: string;
  /** Node type for display */
  nodeType: AutomationNodeType;
  /** Screen position for menu */
  position: { x: number; y: number };
  /** Whether the node is currently disabled */
  isDisabled?: boolean;
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * Context menu that appears on right-click on a node.
 * Positioned absolutely at cursor location.
 */
export const NodeContextMenu = memo(function NodeContextMenu({
  nodeId,
  nodeType,
  position,
  isDisabled = false,
  onClose,
}: NodeContextMenuProps) {
  const { deleteNode, duplicateNode, toggleNodeDisabled } = useFlowStore();

  const handleDelete = useCallback(() => {
    deleteNode(nodeId);
    onClose();
    toast.success('Node deleted');
  }, [deleteNode, nodeId, onClose]);

  const handleDuplicate = useCallback(() => {
    const newId = duplicateNode(nodeId);
    onClose();
    if (newId) {
      toast.success('Node duplicated');
    }
  }, [duplicateNode, nodeId, onClose]);

  const handleToggleDisabled = useCallback(() => {
    toggleNodeDisabled(nodeId);
    onClose();
    toast.success(isDisabled ? 'Node enabled' : 'Node disabled');
  }, [toggleNodeDisabled, nodeId, isDisabled, onClose]);

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(nodeId);
    onClose();
    toast.success('Node ID copied');
  }, [nodeId, onClose]);

  // Calculate position to keep menu in viewport
  const menuStyle = {
    position: 'fixed' as const,
    top: position.y,
    left: position.x,
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
        className="min-w-[140px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      >
        <button
          onClick={handleDuplicate}
          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <Copy06 className="mr-2 h-3 w-3" aria-hidden="true" />
          Duplicate
          <span className="ml-auto text-2xs tracking-widest text-muted-foreground">
            ⌘D
          </span>
        </button>

        <button
          onClick={handleToggleDisabled}
          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <SlashCircle01 className="mr-2 h-3 w-3" aria-hidden="true" />
          {isDisabled ? 'Enable' : 'Disable'}
        </button>

        <button
          onClick={handleCopyId}
          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <Copy01 className="mr-2 h-3 w-3" aria-hidden="true" />
          Copy ID
        </button>

        <div className="-mx-1 my-1 h-px bg-border" />

        <button
          onClick={handleDelete}
          className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1 text-xs outline-none text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
        >
          <Trash01 className="mr-2 h-3 w-3" aria-hidden="true" />
          Delete
          <span className="ml-auto text-2xs tracking-widest text-muted-foreground">
            Del
          </span>
        </button>
      </div>
    </>
  );
});
