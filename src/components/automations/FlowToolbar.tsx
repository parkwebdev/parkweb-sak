/**
 * FlowToolbar Component
 * 
 * Toolbar for the automation editor with save, undo/redo, and close actions.
 * Memoized for performance.
 * 
 * @module components/automations/FlowToolbar
 */

import { memo } from 'react';
import { ArrowLeft, ReverseLeft, ReverseRight, Save01, PlayCircle, ClockRewind, DotsVertical, Trash01, ChevronDown, Circle } from '@untitledui/icons';
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
import type { Automation, AutomationStatus } from '@/types/automations';

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
  onStatusChange?: (status: AutomationStatus, enabled: boolean) => void;
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
  onStatusChange,
}: FlowToolbarProps) {
  const { undo, redo, canUndo, canRedo } = useFlowHistory();

  const getStatusColor = (status: AutomationStatus) => {
    switch (status) {
      case 'active': return 'fill-status-active text-status-active';
      case 'paused': return 'fill-status-warning text-status-warning';
      case 'error': return 'fill-destructive text-destructive';
      default: return 'fill-muted-foreground text-muted-foreground';
    }
  };

  const getStatusBadgeVariant = (status: AutomationStatus, enabled: boolean) => {
    if (enabled && status === 'active') return 'default';
    if (status === 'error') return 'destructive';
    return 'secondary';
  };

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
        
        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              <Badge 
                variant={getStatusBadgeVariant(automation.status, automation.enabled)} 
                size="sm"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                {automation.status}
                <ChevronDown size={12} className="ml-1" aria-hidden="true" />
              </Badge>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => onStatusChange?.('draft', false)}>
              <Circle size={8} className="mr-2 fill-muted-foreground text-muted-foreground" aria-hidden="true" />
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.('active', true)}>
              <Circle size={8} className="mr-2 fill-status-active text-status-active" aria-hidden="true" />
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.('paused', false)}>
              <Circle size={8} className="mr-2 fill-status-warning text-status-warning" aria-hidden="true" />
              Paused
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
