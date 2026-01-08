/**
 * NodeConfigPanel Component
 * 
 * Dynamic panel that shows the configuration UI for the selected node.
 * Renders different panels based on node type.
 * 
 * @module components/automations/NodeConfigPanel
 */

import { useMemo } from 'react';
import { X } from '@untitledui/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IconButton } from '@/components/ui/icon-button';
import { useFlowStore } from '@/stores/automationFlowStore';
import {
  TriggerEventConfigPanel,
  TriggerScheduleConfigPanel,
  TriggerManualConfigPanel,
  TriggerAIToolConfigPanel,
  ActionHttpConfigPanel,
  ActionEmailConfigPanel,
  ActionUpdateLeadConfigPanel,
} from './panels';
import type {
  AutomationNode,
  TriggerEventNodeData,
  TriggerScheduleNodeData,
  TriggerManualNodeData,
  TriggerAIToolNodeData,
  ActionHttpNodeData,
  ActionEmailNodeData,
  ActionUpdateLeadNodeData,
} from '@/types/automations';

interface NodeConfigPanelProps {
  onClose: () => void;
}

export function NodeConfigPanel({ onClose }: NodeConfigPanelProps) {
  const nodes = useFlowStore((state) => state.nodes);

  // Find the selected node
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.selected);
  }, [nodes]) as AutomationNode | undefined;

  if (!selectedNode) {
    return null;
  }

  const renderConfigPanel = () => {
    switch (selectedNode.type) {
      case 'trigger-event':
        return (
          <TriggerEventConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerEventNodeData}
          />
        );
      case 'trigger-schedule':
        return (
          <TriggerScheduleConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerScheduleNodeData}
          />
        );
      case 'trigger-manual':
        return (
          <TriggerManualConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerManualNodeData}
          />
        );
      case 'trigger-ai-tool':
        return (
          <TriggerAIToolConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as TriggerAIToolNodeData}
          />
        );
      case 'action-http':
        return (
          <ActionHttpConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as ActionHttpNodeData}
          />
        );
      case 'action-email':
        return (
          <ActionEmailConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as ActionEmailNodeData}
          />
        );
      case 'action-update-lead':
        return (
          <ActionUpdateLeadConfigPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as ActionUpdateLeadNodeData}
          />
        );
      default:
        return (
          <div className="p-4 text-sm text-muted-foreground">
            No configuration available for this node type.
          </div>
        );
    }
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium">Node Settings</h3>
        <IconButton
          label="Close panel"
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X size={16} aria-hidden="true" />
        </IconButton>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Node label (readonly for now) */}
          <div className="mb-4 pb-4 border-b border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {selectedNode.type?.replace(/-/g, ' ')}
            </div>
            <div className="font-medium">
              {(selectedNode.data as { label?: string }).label || 'Untitled'}
            </div>
          </div>

          {/* Type-specific config */}
          {renderConfigPanel()}
        </div>
      </ScrollArea>
    </div>
  );
}
