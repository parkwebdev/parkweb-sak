/**
 * @fileoverview Leads TopBar Right Section
 * 
 * Self-contained component for the right side of the Leads page TopBar.
 * Manages its own state and data fetching to prevent re-render cascades
 * from propagating to the parent's TopBar config.
 * 
 * @module components/leads/LeadsTopBarRight
 */

import { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { Download01, LayersThree01 } from '@untitledui/icons';
import { useLeadStages } from '@/hooks/useLeadStages';
import { useTeam } from '@/hooks/useTeam';
import { useCanManage } from '@/hooks/useCanManage';
import { LeadsActiveFilters, type DateRangeFilter } from './LeadsActiveFilters';
import { LeadsSortDropdown } from './LeadsSortDropdown';
import { LeadsPropertiesDropdown } from './LeadsPropertiesDropdown';
import { ViewModeToggle } from './ViewModeToggle';
import { IconButton } from '@/components/ui/icon-button';
import { type SortOption } from './LeadsViewSettingsSheet';
import { type CardFieldKey, getDefaultVisibleFields, CARD_FIELDS } from './KanbanCardFields';
import type { VisibilityState } from '@tanstack/react-table';

// localStorage keys for per-user preferences
const VIEW_MODE_KEY = 'leads-view-mode';
const KANBAN_FIELDS_KEY = 'leads-kanban-fields';
const KANBAN_FIELDS_VERSION_KEY = 'leads-kanban-fields-version';
const KANBAN_FIELD_ORDER_KEY = 'leads-kanban-field-order';
const TABLE_COLUMNS_KEY = 'leads-table-columns';
const TABLE_COLUMN_ORDER_KEY = 'leads-table-column-order';
const DEFAULT_SORT_KEY = 'leads-default-sort';

// Increment this when adding new default fields to trigger migration
const KANBAN_FIELDS_VERSION = 1;

// Default table column visibility
const DEFAULT_TABLE_COLUMNS: VisibilityState = {
  name: true,
  email: true,
  phone: true,
  stage_id: true,
  priority: true,
  assignees: true,
  location: false,
  source: false,
  created_at: true,
  updated_at: false,
};

// Default table column order
const DEFAULT_TABLE_COLUMN_ORDER = ['name', 'email', 'phone', 'stage_id', 'priority', 'assignees', 'location', 'source', 'created_at', 'updated_at'];

// Default kanban field order
const DEFAULT_KANBAN_FIELD_ORDER: CardFieldKey[] = CARD_FIELDS.map(f => f.key);

export interface LeadsTopBarRightProps {
  /** Current view mode */
  viewMode: 'kanban' | 'table';
  /** Callback when view mode changes */
  onViewModeChange: (mode: 'kanban' | 'table') => void;
  /** Selected stage IDs for filtering */
  selectedStageIds: string[];
  /** Callback when stage filter changes */
  onStageFilterChange: (ids: string[]) => void;
  /** Selected assignee IDs for filtering */
  selectedAssigneeIds: string[];
  /** Callback when assignee filter changes */
  onAssigneeFilterChange: (ids: string[]) => void;
  /** Current date range filter */
  dateRangeFilter: DateRangeFilter;
  /** Callback when date range filter changes */
  onDateRangeFilterChange: (filter: DateRangeFilter) => void;
  /** Callback to open export dialog */
  onOpenExport: () => void;
  /** Callback to open manage stages dialog */
  onOpenManageStages: () => void;
}

/**
 * Self-contained right section of the Leads TopBar.
 * Fetches its own data (stages, team) to isolate data dependencies.
 */
export const LeadsTopBarRight = memo(function LeadsTopBarRight({
  viewMode,
  onViewModeChange,
  selectedStageIds,
  onStageFilterChange,
  selectedAssigneeIds,
  onAssigneeFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  onOpenExport,
  onOpenManageStages,
}: LeadsTopBarRightProps) {
  // Fetch data internally - these won't cause parent re-renders
  const { stages } = useLeadStages();
  const { teamMembers } = useTeam();
  const canManageLeads = useCanManage('manage_leads');

  // Use refs for callbacks to keep component stable
  const onOpenExportRef = useRef(onOpenExport);
  const onOpenManageStagesRef = useRef(onOpenManageStages);
  useEffect(() => {
    onOpenExportRef.current = onOpenExport;
    onOpenManageStagesRef.current = onOpenManageStages;
  });

  const handleOpenExport = useCallback(() => {
    onOpenExportRef.current();
  }, []);

  const handleOpenManageStages = useCallback(() => {
    onOpenManageStagesRef.current();
  }, []);

  // Per-user kanban visible fields with version-based migration
  const [visibleCardFields, setVisibleCardFields] = useState<Set<CardFieldKey>>(() => {
    const defaults = getDefaultVisibleFields();
    
    try {
      const storedVersion = localStorage.getItem(KANBAN_FIELDS_VERSION_KEY);
      const stored = localStorage.getItem(KANBAN_FIELDS_KEY);
      
      if (stored) {
        const savedFields = new Set(JSON.parse(stored) as CardFieldKey[]);
        
        // If version mismatch, merge in new default fields
        if (storedVersion !== String(KANBAN_FIELDS_VERSION)) {
          for (const field of defaults) {
            savedFields.add(field);
          }
          localStorage.setItem(KANBAN_FIELDS_KEY, JSON.stringify([...savedFields]));
          localStorage.setItem(KANBAN_FIELDS_VERSION_KEY, String(KANBAN_FIELDS_VERSION));
        }
        
        return savedFields;
      }
    } catch (e: unknown) {
      console.warn('Failed to read kanban fields from localStorage:', e);
    }
    
    localStorage.setItem(KANBAN_FIELDS_VERSION_KEY, String(KANBAN_FIELDS_VERSION));
    return defaults;
  });

  // Per-user table column visibility
  const [tableColumnVisibility, setTableColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const stored = localStorage.getItem(TABLE_COLUMNS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e: unknown) {
      console.warn('Failed to read table columns from localStorage:', e);
    }
    return DEFAULT_TABLE_COLUMNS;
  });

  // Per-user table column order
  const [tableColumnOrder, setTableColumnOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(TABLE_COLUMN_ORDER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e: unknown) {
      console.warn('Failed to read table column order from localStorage:', e);
    }
    return DEFAULT_TABLE_COLUMN_ORDER;
  });

  // Per-user kanban field order
  const [kanbanFieldOrder, setKanbanFieldOrder] = useState<CardFieldKey[]>(() => {
    try {
      const stored = localStorage.getItem(KANBAN_FIELD_ORDER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e: unknown) {
      console.warn('Failed to read kanban field order from localStorage:', e);
    }
    return DEFAULT_KANBAN_FIELD_ORDER;
  });

  // Per-user default sort preference
  const [defaultSort, setDefaultSort] = useState<SortOption | null>(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_SORT_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e: unknown) {
      console.warn('Failed to read default sort from localStorage:', e);
    }
    return null;
  });

  // Settings update handlers
  const handleColumnVisibilityChange = useCallback((visibility: VisibilityState) => {
    setTableColumnVisibility(visibility);
    localStorage.setItem(TABLE_COLUMNS_KEY, JSON.stringify(visibility));
  }, []);

  const handleColumnOrderChange = useCallback((order: string[]) => {
    setTableColumnOrder(order);
    localStorage.setItem(TABLE_COLUMN_ORDER_KEY, JSON.stringify(order));
  }, []);

  const handleKanbanFieldOrderChange = useCallback((order: CardFieldKey[]) => {
    setKanbanFieldOrder(order);
    localStorage.setItem(KANBAN_FIELD_ORDER_KEY, JSON.stringify(order));
  }, []);

  const handleDefaultSortChange = useCallback((sort: SortOption | null) => {
    setDefaultSort(sort);
    localStorage.setItem(DEFAULT_SORT_KEY, JSON.stringify(sort));
  }, []);

  const handleToggleField = useCallback((field: CardFieldKey) => {
    setVisibleCardFields(prev => {
      const updated = new Set(prev);
      if (updated.has(field)) {
        updated.delete(field);
      } else {
        updated.add(field);
      }
      localStorage.setItem(KANBAN_FIELDS_KEY, JSON.stringify([...updated]));
      return updated;
    });
  }, []);

  // Memoize stages for filter component
  const stagesForFilter = useMemo(() => stages, [stages]);

  return (
    <div className="flex items-center gap-1">
      {/* Action buttons */}
      <IconButton
        label="Export leads"
        variant="outline"
        size="sm"
        onClick={handleOpenExport}
      >
        <Download01 size={16} />
      </IconButton>
      {canManageLeads && (
        <IconButton
          label="Manage stages"
          variant="outline"
          size="sm"
          onClick={handleOpenManageStages}
        >
          <LayersThree01 size={16} />
        </IconButton>
      )}

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Filter controls */}
      <LeadsActiveFilters
        stages={stagesForFilter}
        selectedStageIds={selectedStageIds}
        onStageFilterChange={onStageFilterChange}
        dateRange={dateRangeFilter}
        onDateRangeChange={onDateRangeFilterChange}
        teamMembers={teamMembers}
        selectedAssigneeIds={selectedAssigneeIds}
        onAssigneeFilterChange={onAssigneeFilterChange}
      />
      {viewMode === 'kanban' && (
        <LeadsSortDropdown
          sortOption={defaultSort}
          onSortChange={handleDefaultSortChange}
        />
      )}
      <LeadsPropertiesDropdown
        viewMode={viewMode}
        visibleCardFields={visibleCardFields}
        onToggleCardField={handleToggleField}
        kanbanFieldOrder={kanbanFieldOrder}
        onKanbanFieldOrderChange={handleKanbanFieldOrderChange}
        columnVisibility={tableColumnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        tableColumnOrder={tableColumnOrder}
        onColumnOrderChange={handleColumnOrderChange}
      />
      <ViewModeToggle
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
    </div>
  );
});
