/**
 * FlowToolbar Component
 * 
 * Toolbar for the automation editor with save, undo/redo, and close actions.
 * Includes validation-aware publish/activate controls.
 * Memoized for performance.
 * 
 * @module components/automations/FlowToolbar
 */

import { memo } from 'react';
import { ArrowLeft, ReverseLeft, ReverseRight, Save01, Play, ClockRewind, DotsVertical, Trash01, ChevronDown, Circle, AlertCircle } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LastSavedIndicator } from '@/components/automations/LastSavedIndicator';
import { useFlowHistory } from '@/stores/automationFlowStore';
import { useAutomationValidation } from '@/hooks/useAutomationValidation';
import type { Automation, AutomationStatus, AutomationTriggerType } from '@/types/automations';

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
  /** Handler for running manual automations */
  onRunClick?: () => void;
  /** Whether the automation is currently running */
  running?: boolean;
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
  onRunClick,
  running = false,
}: FlowToolbarProps) {
  const { undo, redo, canUndo, canRedo } = useFlowHistory();
  const { isValid, errorCount } = useAutomationValidation();

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

  // Block activation if invalid
  const handleStatusChange = (status: AutomationStatus, enabled: boolean) => {
    if (status === 'active' && !isValid) {
      // Don't allow activation if invalid
      return;
    }
    onStatusChange?.(status, enabled);
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
            <DropdownMenuItem onSelect={() => handleStatusChange('draft', false)}>
              <Circle size={8} className="mr-2 fill-muted-foreground text-muted-foreground" aria-hidden="true" />
              Draft
            </DropdownMenuItem>
            {/* Active option - disabled if invalid */}
            {isValid ? (
              <DropdownMenuItem onSelect={() => handleStatusChange('active', true)}>
                <Circle size={8} className="mr-2 fill-status-active text-status-active" aria-hidden="true" />
                Active
              </DropdownMenuItem>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center px-2 py-1.5 text-sm text-muted-foreground cursor-not-allowed opacity-50">
                    <Circle size={8} className="mr-2 fill-status-active text-status-active" aria-hidden="true" />
                    Active
                    <AlertCircle size={12} className="ml-auto text-destructive" aria-hidden="true" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Fix {errorCount} validation error{errorCount !== 1 ? 's' : ''} before activating
                </TooltipContent>
              </Tooltip>
            )}
            <DropdownMenuItem onSelect={() => handleStatusChange('paused', false)}>
              <Circle size={8} className="mr-2 fill-status-warning text-status-warning" aria-hidden="true" />
              Paused
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Validation indicator */}
        {!isValid && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium">
                <AlertCircle size={12} aria-hidden="true" />
                {errorCount} issue{errorCount !== 1 ? 's' : ''}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              Complete required fields to activate this automation
            </TooltipContent>
          </Tooltip>
        )}
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

      {/* History button */}
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

      {/* Run, Test & Save buttons */}
      <div className="flex items-center gap-2">
        {/* Run Now - only for manual triggers */}
        {automation.trigger_type === 'manual' && onRunClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRunClick}
                  disabled={isDirty || running || !isValid}
                >
                  <Play size={16} className="mr-1.5" aria-hidden="true" />
                  {running ? 'Running...' : 'Run Now'}
                </Button>
              </span>
            </TooltipTrigger>
            {!isValid && (
              <TooltipContent>
                Fix validation errors before running
              </TooltipContent>
            )}
          </Tooltip>
        )}
        {onTestClick && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onTestClick}
                  disabled={isDirty || !isValid}
                >
                  <Play size={16} className="mr-1.5" aria-hidden="true" />
                  Test
                </Button>
              </span>
            </TooltipTrigger>
            {!isValid && (
              <TooltipContent>
                Fix validation errors before testing
              </TooltipContent>
            )}
          </Tooltip>
        )}
        <Button 
          size="sm" 
          onClick={onSave} 
          disabled={!isDirty || saving}
        >
          <Save01 size={16} className="mr-1.5" aria-hidden="true" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

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
              onSelect={onDeleteClick}
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
