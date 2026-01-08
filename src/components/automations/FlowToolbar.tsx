/**
 * FlowToolbar Component
 * 
 * Toolbar for the automation editor with save, undo/redo, and close actions.
 * 
 * @module components/automations/FlowToolbar
 */

import { ArrowLeft, ReverseLeft, ReverseRight, Save01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import { LastSavedIndicator } from '@/components/automations/LastSavedIndicator';
import { useFlowHistory } from '@/stores/automationFlowStore';
import type { Automation } from '@/types/automations';

interface FlowToolbarProps {
  automation: Automation;
  isDirty: boolean;
  saving: boolean;
  lastSavedAt: Date | null;
  saveError?: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function FlowToolbar({ 
  automation, 
  isDirty, 
  saving,
  lastSavedAt,
  saveError = false,
  onSave, 
  onClose 
}: FlowToolbarProps) {
  const { undo, redo, canUndo, canRedo } = useFlowHistory();

  return (
    <div className="h-12 border-b border-border px-4 flex items-center gap-4 bg-card">
      {/* Back button */}
      <IconButton
        label="Close editor"
        variant="ghost"
        size="sm"
        onClick={onClose}
      >
        <ArrowLeft size={16} />
      </IconButton>

      {/* Automation name */}
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-medium text-foreground">
          {automation.name}
        </h1>
        <Badge variant={automation.enabled ? 'default' : 'secondary'} size="sm">
          {automation.status}
        </Badge>
      </div>

      {/* Last saved indicator */}
      <LastSavedIndicator
        lastSavedAt={lastSavedAt}
        saving={saving}
        isDirty={isDirty}
        saveError={saveError}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <IconButton
          label="Undo"
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
        >
          <ReverseLeft size={16} />
        </IconButton>
        <IconButton
          label="Redo"
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
        >
          <ReverseRight size={16} />
        </IconButton>
      </div>

      {/* Save button */}
      <Button 
        size="sm" 
        onClick={onSave} 
        disabled={!isDirty || saving}
      >
        <Save01 size={16} className="mr-1.5" aria-hidden="true" />
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
