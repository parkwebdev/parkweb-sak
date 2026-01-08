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
import type { Automation, CreateAutomationData } from '@/types/automations';

function Automations() {
  const { automations, loading, createAutomation, creating } = useAutomations();
  const [selectedAutomationId, setSelectedAutomationId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  // Loading state
  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-80 border-r border-border flex-shrink-0">
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
      <div className="w-80 border-r border-border flex-shrink-0 overflow-hidden flex flex-col">
        <AutomationsList
          automations={automations}
          selectedId={selectedAutomationId}
          onSelect={handleSelectAutomation}
          onCreateClick={() => setCreateDialogOpen(true)}
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
    </div>
  );
}

export default Automations;
