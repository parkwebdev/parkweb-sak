/**
 * Automations Page
 * 
 * Visual workflow builder for creating automations.
 * Two-panel layout: list on left, editor on right.
 * 
 * @module pages/Automations
 */

import { useState, useCallback } from 'react';
import { useAutomations } from '@/hooks/useAutomations';
import { AutomationsList } from '@/components/automations/AutomationsList';
import { AutomationEditor } from '@/components/automations/AutomationEditor';
import { AutomationsEmptyState } from '@/components/automations/AutomationsEmptyState';
import { AutomationsListSkeleton } from '@/components/automations/AutomationsListSkeleton';
import { CreateAutomationDialog } from '@/components/automations/CreateAutomationDialog';
import { RunAutomationDialog } from '@/components/automations/RunAutomationDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { triggerAutomation } from '@/lib/trigger-automation';
import type { AutomationListItem, CreateAutomationData, TriggerManualConfig } from '@/types/automations';

function Automations() {
  const { automations, loading, createAutomation, creating, deleteAutomation, deleting } = useAutomations();
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<AutomationListItem | null>(null);
  const [automationToRun, setAutomationToRun] = useState<AutomationListItem | null>(null);
  const [triggering, setTriggering] = useState(false);

  const handleCreate = useCallback(async (data: CreateAutomationData) => {
    const automation = await createAutomation(data);
    setSelectedAutomationId(automation.id);
    setCreateDialogOpen(false);
  }, [createAutomation]);

  const handleSelectAutomation = useCallback((id: string) => {
    setSelectedAutomationId(id);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedAutomationId(null);
  }, []);

  const handleDeleteFromList = useCallback((id: string) => {
    const automation = automations.find((a) => a.id === id);
    if (automation) {
      setAutomationToDelete(automation);
      setDeleteDialogOpen(true);
    }
  }, [automations]);

  const handleConfirmDelete = useCallback(async () => {
    if (!automationToDelete) return;
    await deleteAutomation(automationToDelete.id);
    setDeleteDialogOpen(false);
    setAutomationToDelete(null);
    // If deleted automation was selected, deselect it
    if (selectedAutomationId === automationToDelete.id) {
      setSelectedAutomationId(null);
    }
  }, [automationToDelete, deleteAutomation, selectedAutomationId]);

  const handleRunFromList = useCallback((id: string) => {
    const automation = automations.find((a) => a.id === id);
    if (automation) {
      const config = automation.trigger_config as TriggerManualConfig;
      if (config?.requireConfirmation) {
        setAutomationToRun(automation);
        setRunDialogOpen(true);
      } else {
        // Run immediately without confirmation - call edge function directly
        setTriggering(true);
        triggerAutomation({ automationId: id }).finally(() => {
          setTriggering(false);
        });
      }
    }
  }, [automations]);

  const handleConfirmRun = useCallback(async () => {
    if (!automationToRun) return;
    setTriggering(true);
    await triggerAutomation({ automationId: automationToRun.id });
    setTriggering(false);
    setRunDialogOpen(false);
    setAutomationToRun(null);
  }, [automationToRun]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-64 border-r border-border flex-shrink-0">
          <AutomationsListSkeleton />
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <p className="text-muted-foreground text-sm">Loading automations...</p>
        </div>
      </div>
    );
  }

  // Empty state - no automations yet
  if (automations.length === 0 && !selectedAutomationId) {
    return (
      <>
        <AutomationsEmptyState onCreateClick={() => setCreateDialogOpen(true)} />
        <CreateAutomationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreate}
          loading={creating}
        />
      </>
    );
  }

  return (
    <div className="flex h-full">
      {/* Automations list sidebar */}
      <div className="w-64 border-r border-border flex-shrink-0 overflow-hidden flex flex-col">
        <AutomationsList
          automations={automations}
          selectedId={selectedAutomationId}
          onSelect={handleSelectAutomation}
          onCreateClick={() => setCreateDialogOpen(true)}
          onDeleteClick={handleDeleteFromList}
          onRunClick={handleRunFromList}
        />
      </div>

      {/* Editor or placeholder */}
      <div className="flex-1 overflow-hidden">
        {selectedAutomationId ? (
          <AutomationEditor
            automationId={selectedAutomationId}
            onClose={handleCloseEditor}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Select an automation to edit or create a new one
              </p>
            </div>
          </div>
        )}
      </div>

      <CreateAutomationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
        loading={creating}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete automation"
        description={automationToDelete ? `This will permanently delete "${automationToDelete.name}" and all its execution history. This action cannot be undone.` : ''}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting}
      />

      <RunAutomationDialog
        open={runDialogOpen}
        onOpenChange={setRunDialogOpen}
        automation={automationToRun}
        onRun={handleConfirmRun}
        running={triggering}
      />
    </div>
  );
}

export default Automations;
