/**
 * AutomationEditor Component
 * 
 * Editor wrapper that loads automation data and renders the flow editor.
 * 
 * @module components/automations/AutomationEditor
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAutomations } from '@/hooks/useAutomations';
import { useFlowStore } from '@/stores/automationFlowStore';
import { FlowEditor } from '@/components/automations/FlowEditor';
import { FlowToolbar } from '@/components/automations/FlowToolbar';
import { NodeSidebar } from '@/components/automations/NodeSidebar';
import { AutomationErrorBoundary } from '@/components/automations/AutomationErrorBoundary';
import { NodeConfigPanel } from '@/components/automations/NodeConfigPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import type { Automation } from '@/types/automations';

interface AutomationEditorProps {
  automationId: string;
  onClose: () => void;
}

export function AutomationEditor({ automationId, onClose }: AutomationEditorProps) {
  const { getAutomation, updateAutomation, updating } = useAutomations();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { nodes, edges, viewport, isDirty, loadFlow, markClean } = useFlowStore();
  const [configPanelOpen, setConfigPanelOpen] = useState(false);

  // Detect selected node
  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);

  // Open config panel when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setConfigPanelOpen(true);
    }
  }, [selectedNode?.id]);

  // Load automation on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await getAutomation(automationId);
      if (!cancelled && data) {
        setAutomation(data);
        loadFlow(data.nodes, data.edges, data.viewport);
      }
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [automationId, getAutomation, loadFlow]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!automation) return;

    try {
      await updateAutomation({
        id: automation.id,
        nodes,
        edges,
        viewport,
      });
      markClean();
      toast.success('Automation saved');
    } catch (error: unknown) {
      toast.error('Failed to save', { description: getErrorMessage(error) });
    }
  }, [automation, nodes, edges, viewport, updateAutomation, markClean]);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-12 border-b border-border px-4 flex items-center gap-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-16 ml-auto" />
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground text-sm">Loading automation...</p>
        </div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground text-sm">Automation not found</p>
      </div>
    );
  }

  const handleErrorReset = useCallback(() => {
    // Reload automation data on error reset
    loadFlow(automation.nodes, automation.edges, automation.viewport);
  }, [automation, loadFlow]);

  return (
    <AutomationErrorBoundary onReset={handleErrorReset}>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <FlowToolbar
          automation={automation}
          isDirty={isDirty}
          saving={updating}
          onSave={handleSave}
          onClose={onClose}
        />

        {/* Editor area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Node sidebar */}
          <NodeSidebar />

          {/* Flow canvas */}
          <div className="flex-1">
            <FlowEditor />
          </div>

          {/* Node config panel */}
          {configPanelOpen && selectedNode && (
            <NodeConfigPanel onClose={() => setConfigPanelOpen(false)} />
          )}
        </div>
      </div>
    </AutomationErrorBoundary>
  );
}
