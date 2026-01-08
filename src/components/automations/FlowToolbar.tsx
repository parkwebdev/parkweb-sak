/**
 * FlowToolbar Component
 * 
 * Toolbar for the automation editor with save, undo/redo, and close actions.
 * Memoized for performance.
 * 
 * @module components/automations/FlowToolbar
 */

import { memo } from 'react';
import { ArrowLeft, ReverseLeft, ReverseRight, Save01, PlayCircle, ClockRewind, DotsVertical, Trash01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  onTestClick?: () => void;
  onHistoryClick?: () => void;
  onDeleteClick?: () => void;
  canDelete?: boolean;
}

export const FlowToolbar = memo(function FlowToolbar({
  automation, 
  isDirty, 
  saving,
  lastSavedAt,
  saveError = false,
  onSave, 
  onClose,
  onTestClick,
  onHistoryClick,
  onDeleteClick,
  canDelete = true,
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

      {/* Test & History buttons */}
      <div className="flex items-center gap-1">
        {onTestClick && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onTestClick}
            disabled={isDirty}
          >
            <PlayCircle size={16} className="mr-1.5" aria-hidden="true" />
            Test
          </Button>
        )}
        {onHistoryClick && (
          <IconButton
            label="Execution history"
            variant="ghost"
            size="sm"
            onClick={onHistoryClick}
          >
            <ClockRewind size={16} />
          </IconButton>
        )}
      </div>

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

      {/* More actions dropdown */}
      {canDelete && onDeleteClick && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label="More actions" variant="ghost" size="sm">
              <DotsVertical size={16} />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onDeleteClick}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash01 size={16} className="mr-2" aria-hidden="true" />
              Delete automation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});
