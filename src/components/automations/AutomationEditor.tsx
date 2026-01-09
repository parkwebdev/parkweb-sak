/**
 * AutomationEditor Component
 * 
 * Editor wrapper that loads automation data and renders the flow editor.
 * Includes auto-save with 3s debounce.
 * 
 * @module components/automations/AutomationEditor
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useAutomations } from '@/hooks/useAutomations';
import { useCanManage } from '@/hooks/useCanManage';
import { useAutomationAutoSave } from '@/hooks/useAutomationAutoSave';
import { useAutomationExecutions } from '@/hooks/useAutomationExecutions';
import { useFlowStore } from '@/stores/automationFlowStore';
import { FlowEditor } from '@/components/automations/FlowEditor';
import { FlowToolbar } from '@/components/automations/FlowToolbar';
import { NodeSidebar } from '@/components/automations/NodeSidebar';
import { AutomationErrorBoundary } from '@/components/automations/AutomationErrorBoundary';
import { NodeConfigPanel } from '@/components/automations/NodeConfigPanel';
import { ExecutionPanel } from '@/components/automations/ExecutionPanel';
import { TestExecutionDialog } from '@/components/automations/TestExecutionDialog';
import { RunAutomationDialog } from '@/components/automations/RunAutomationDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Automation, AutomationStatus, TriggerManualConfig } from '@/types/automations';

interface AutomationEditorProps {
  automationId: string;
  onClose: () => void;
}

export function AutomationEditor({ automationId, onClose }: AutomationEditorProps) {
  const { getAutomation, updateAutomation, deleteAutomation, deleting } = useAutomations();
  const canManageAutomations = useCanManage('manage_ari');
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { nodes, edges, viewport, isDirty, loadFlow, markClean } = useFlowStore();
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [executionPanelOpen, setExecutionPanelOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Auto-save hook
  const { saving, lastSavedAt, saveNow, saveError } = useAutomationAutoSave({
    automation,
    enabled: true,
  });

  // Execution hook for test runs (only initialize when automation is loaded)
  const { triggerExecution, triggering } = useAutomationExecutions({ 
    automationId: automationId 
  });

  // Detect selected node
  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);

  // Open config panel when a node is selected
  useEffect(() => {
    if (selectedNode) {
      setConfigPanelOpen(true);
    }
  }, [selectedNode?.id]);

  // Load automation on mount or when ID changes
  useEffect(() => {
    let cancelled = false;

    // Reset state immediately when automation ID changes
    setLoading(true);
    setAutomation(null);

    async function load() {
      const data = await getAutomation(automationId);
      if (!cancelled && data) {
        setAutomation(data);
        loadFlow(data.nodes, data.edges, data.viewport);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [automationId, getAutomation, loadFlow]);

  // Manual save handler (for save button)
  const handleSave = useCallback(async () => {
    await saveNow();
  }, [saveNow]);

  // Test/History handlers
  const handleTestClick = useCallback(() => {
    setTestDialogOpen(true);
  }, []);

  const handleTestSubmit = useCallback(async (testData: Record<string, unknown>) => {
    await triggerExecution({
      triggerData: testData,
      testMode: true,
    });
    setTestDialogOpen(false);
  }, [triggerExecution]);

  const handleHistoryClick = useCallback(() => {
    setExecutionPanelOpen(true);
  }, []);

  // Run handlers (for manual trigger automations)
  const handleRunClick = useCallback(() => {
    if (!automation) return;
    const config = automation.trigger_config as TriggerManualConfig;
    if (config?.requireConfirmation) {
      setRunDialogOpen(true);
    } else {
      triggerExecution({ testMode: false });
    }
  }, [automation, triggerExecution]);

  const handleConfirmRun = useCallback(() => {
    triggerExecution({ testMode: false });
    setRunDialogOpen(false);
  }, [triggerExecution]);

  // Status change handler
  const handleStatusChange = useCallback(async (newStatus: AutomationStatus, enabled: boolean) => {
    if (!automation) return;
    
    // If enabling, require save first (no unsaved changes)
    if (enabled && isDirty) {
      toast.error('Save your changes first', { 
        description: 'You must save before publishing.' 
      });
      return;
    }
    
    await updateAutomation({
      id: automation.id,
      status: newStatus,
      enabled,
    });
    
    // Update local state
    setAutomation(prev => prev ? { ...prev, status: newStatus, enabled } : null);
    
    toast.success(enabled ? 'Automation published' : `Automation set to ${newStatus}`);
  }, [automation, isDirty, updateAutomation]);

  // Delete handlers
  const handleDeleteClick = useCallback(() => {
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    await deleteAutomation(automationId);
    setDeleteDialogOpen(false);
    onClose();
  }, [automationId, deleteAutomation, onClose]);

  // Error reset handler - must be before early returns
  const handleErrorReset = useCallback(() => {
    if (automation) {
      loadFlow(automation.nodes, automation.edges, automation.viewport);
    }
  }, [automation, loadFlow]);

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

  return (
    <AutomationErrorBoundary onReset={handleErrorReset}>
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <FlowToolbar
          automation={automation}
          isDirty={isDirty}
          saving={saving}
          lastSavedAt={lastSavedAt}
          saveError={saveError}
          onSave={handleSave}
          onClose={onClose}
          onTestClick={handleTestClick}
          onHistoryClick={handleHistoryClick}
          onDeleteClick={handleDeleteClick}
          canDelete={canManageAutomations}
          onStatusChange={handleStatusChange}
          onRunClick={automation.trigger_type === 'manual' ? handleRunClick : undefined}
          running={triggering}
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

          {/* Execution panel */}
          {executionPanelOpen && (
            <ExecutionPanel 
              automation={automation} 
              onClose={() => setExecutionPanelOpen(false)} 
            />
          )}
        </div>
      </div>

      {/* Test execution dialog */}
      <TestExecutionDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        automation={automation}
        onSubmit={handleTestSubmit}
        loading={triggering}
      />

      {/* Run automation dialog (for manual triggers with confirmation) */}
      <RunAutomationDialog
        open={runDialogOpen}
        onOpenChange={setRunDialogOpen}
        automation={automation}
        onRun={handleConfirmRun}
        running={triggering}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete automation"
        description={`This will permanently delete "${automation.name}" and all its execution history. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting}
      />
    </AutomationErrorBoundary>
  );
}
