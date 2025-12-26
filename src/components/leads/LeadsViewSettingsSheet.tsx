/**
 * @fileoverview Unified settings sheet for Leads page.
 * Provides stacked navigation for Fields, Columns, Stages, Sorting, Presets, and Export options.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { IconButton } from '@/components/ui/icon-button';
import { ColorPicker } from '@/components/ui/color-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  LayoutAlt04,
  Rows03,
  ChevronRight,
  ArrowLeft,
  LayoutGrid01,
  Columns03,
  List,
  Download01,
  Plus,
  Trash01,
  Check,
  DotsGrid,
  Calendar as CalendarIcon,
  SwitchVertical01,
  Bookmark,
  ChevronDown,
  ChevronUp,
} from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Import types and utilities
import type { Tables } from '@/integrations/supabase/types';
import type { ConversationMetadata } from '@/types/metadata';
import type { VisibilityState, SortingState } from '@tanstack/react-table';
import { useLeadStages, type LeadStage } from '@/hooks/useLeadStages';
import {
  getFieldsByGroup,
  getDefaultVisibleFields,
  FIELD_GROUP_LABELS,
  CARD_FIELDS,
  type CardFieldKey,
  type FieldGroup,
} from './KanbanCardFields';
import {
  ExportColumn,
  ExportOptions,
  COLUMN_LABELS,
  DEFAULT_COLUMNS,
  ALL_COLUMNS,
  LeadWithMetadata,
  LeadStage as ExportLeadStage,
  filterLeads,
  exportLeads,
  needsConversationMetadata,
} from '@/lib/leads-export';

// DnD imports for stages and columns
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Table column definitions for the settings sheet
export interface TableColumnDef {
  id: string;
  label: string;
  canHide: boolean;
}

export const TABLE_COLUMNS: TableColumnDef[] = [
  { id: 'name', label: 'Name', canHide: true },
  { id: 'email', label: 'Email', canHide: true },
  { id: 'phone', label: 'Phone', canHide: true },
  { id: 'stage_id', label: 'Stage', canHide: true },
  { id: 'location', label: 'Location', canHide: true },
  { id: 'source', label: 'Source', canHide: true },
  { id: 'created_at', label: 'Created', canHide: true },
  { id: 'updated_at', label: 'Last Updated', canHide: true },
];

export const DEFAULT_TABLE_COLUMN_VISIBILITY: VisibilityState = {
  name: true,
  email: true,
  phone: true,
  stage_id: true,
  location: false,
  source: false,
  created_at: true,
  updated_at: false,
};

export const TABLE_VISIBILITY_STORAGE_KEY = 'leads-table-column-visibility';
export const TABLE_COLUMN_ORDER_STORAGE_KEY = 'leads-table-column-order';
export const DEFAULT_VIEW_MODE_STORAGE_KEY = 'leads-default-view-mode';
export const DEFAULT_SORT_STORAGE_KEY = 'leads-default-sort';
export const VIEW_PRESETS_STORAGE_KEY = 'leads-view-presets';

// Get default column order
export const getDefaultColumnOrder = (): string[] => TABLE_COLUMNS.map(col => col.id);

// View preset type
export interface ViewPreset {
  id: string;
  name: string;
  viewMode: 'kanban' | 'table';
  kanbanFields: CardFieldKey[];
  tableColumns: VisibilityState;
  tableColumnOrder: string[];
  defaultSort: { column: string; direction: 'asc' | 'desc' } | null;
}

// Sort option type
export interface SortOption {
  column: string;
  direction: 'asc' | 'desc';
}

type Lead = Tables<'leads'>;
type SheetView = 'main' | 'fields' | 'columns' | 'stages' | 'export' | 'sorting' | 'presets';
const GROUP_ORDER: FieldGroup[] = ['contact', 'session', 'organization', 'timestamps', 'notes'];

interface LeadsViewSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewMode: 'kanban' | 'table';
  onViewModeChange?: (mode: 'kanban' | 'table') => void;
  // Card fields (Kanban)
  visibleFields: Set<CardFieldKey>;
  onToggleField: (field: CardFieldKey) => void;
  onSetFields: (fields: Set<CardFieldKey>) => void;
  // Table columns (Table view)
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  // Column order
  columnOrder: string[];
  onColumnOrderChange: (order: string[]) => void;
  // Default sort
  defaultSort: SortOption | null;
  onDefaultSortChange: (sort: SortOption | null) => void;
  // Presets
  presets: ViewPreset[];
  onPresetsChange: (presets: ViewPreset[]) => void;
  onApplyPreset: (preset: ViewPreset) => void;
  // Export
  allLeads: Lead[];
  filteredLeads: Lead[];
}

// Sortable stage item component
function SortableStageItem({
  stage,
  onUpdate,
  onDelete,
  isDeleting,
}: {
  stage: LeadStage;
  onUpdate: (id: string, updates: Partial<Pick<LeadStage, 'name' | 'color' | 'is_default'>>) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stage.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleNameSave = useCallback(() => {
    if (editName.trim() && editName !== stage.name) {
      onUpdate(stage.id, { name: editName.trim() });
    }
    setIsEditing(false);
  }, [editName, stage.id, stage.name, onUpdate]);

  const handleColorChange = useCallback((color: string) => {
    onUpdate(stage.id, { color });
  }, [stage.id, onUpdate]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2.5 bg-card border rounded-lg',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder stage"
      >
        <DotsGrid size={14} />
      </button>

      <ColorPicker
        value={stage.color}
        onChange={handleColorChange}
        showAlpha={false}
        compact
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSave();
              if (e.key === 'Escape') {
                setEditName(stage.name);
                setIsEditing(false);
              }
            }}
            className="h-7 text-sm"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-left w-full truncate hover:text-primary"
          >
            {stage.name}
          </button>
        )}
      </div>

      {stage.is_default && (
        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
          Default
        </span>
      )}

      {!stage.is_default && (
        <IconButton
          label="Set as default"
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(stage.id, { is_default: true })}
        >
          <Check size={14} />
        </IconButton>
      )}

      <IconButton
        label="Delete stage"
        variant="ghost"
        size="sm"
        onClick={() => onDelete(stage.id)}
        disabled={isDeleting}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash01 size={14} />
      </IconButton>
    </div>
  );
}

// Sortable column item component for reordering
function SortableColumnItem({
  column,
  isVisible,
  onToggle,
}: {
  column: TableColumnDef;
  isVisible: boolean;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors',
        isDragging && 'opacity-50 shadow-lg bg-card'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Drag to reorder column"
      >
        <DotsGrid size={14} />
      </button>
      <Checkbox
        checked={isVisible}
        onCheckedChange={onToggle}
      />
      <span className="text-sm">{column.label}</span>
    </div>
  );
}

// Fetch conversation metadata for leads
async function fetchConversationMetadata(
  leads: Lead[]
): Promise<Map<string, ConversationMetadata>> {
  const conversationIds = leads
    .filter(l => l.conversation_id)
    .map(l => l.conversation_id as string);

  if (conversationIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('conversations')
    .select('id, metadata')
    .in('id', conversationIds);

  if (error) {
    logger.error('Failed to fetch conversation metadata:', error);
    return new Map();
  }

  return new Map(
    data?.map(c => [c.id, (c.metadata || {}) as ConversationMetadata]) || []
  );
}

function enrichLeadsWithMetadata(
  leads: Lead[],
  metadataMap: Map<string, ConversationMetadata>
): LeadWithMetadata[] {
  return leads.map(lead => {
    if (!lead.conversation_id) return lead;
    const metadata = metadataMap.get(lead.conversation_id);
    if (!metadata) return lead;
    return {
      ...lead,
      conversationMetadata: {
        priority: metadata.priority,
        tags: metadata.tags,
        notes: metadata.notes,
      },
    };
  });
}

export function LeadsViewSettingsSheet({
  open,
  onOpenChange,
  viewMode,
  onViewModeChange,
  visibleFields,
  onToggleField,
  onSetFields,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  defaultSort,
  onDefaultSortChange,
  presets,
  onPresetsChange,
  onApplyPreset,
  allLeads,
  filteredLeads,
}: LeadsViewSettingsSheetProps) {
  const [activeView, setActiveView] = useState<SheetView>('main');
  const { stages, createStage, updateStage, deleteStage, reorderStages, loading: stagesLoading } = useLeadStages();

  // Reset view when sheet closes
  useEffect(() => {
    if (!open) {
      setActiveView('main');
    }
  }, [open]);

  // --- Default view preference ---
  const [defaultViewMode, setDefaultViewMode] = useState<'kanban' | 'table'>(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_VIEW_MODE_STORAGE_KEY);
      if (stored === 'kanban' || stored === 'table') return stored;
    } catch {
      // fallback
    }
    return 'kanban';
  });

  const handleDefaultViewModeChange = useCallback((mode: 'kanban' | 'table') => {
    setDefaultViewMode(mode);
    localStorage.setItem(DEFAULT_VIEW_MODE_STORAGE_KEY, mode);
  }, []);

  // --- Fields logic ---
  const fieldsByGroup = getFieldsByGroup();
  const handleSelectAll = () => {
    onSetFields(new Set(CARD_FIELDS.map(f => f.key)));
  };
  const handleResetToDefaults = () => {
    onSetFields(getDefaultVisibleFields());
  };

  // --- Table Columns logic ---
  const visibleColumnsCount = useMemo(
    () => TABLE_COLUMNS.filter(col => columnVisibility[col.id] !== false).length,
    [columnVisibility]
  );

  const handleColumnToggle = useCallback((columnId: string) => {
    onColumnVisibilityChange({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
    });
  }, [columnVisibility, onColumnVisibilityChange]);

  const handleSelectAllColumns = useCallback(() => {
    const allVisible: VisibilityState = {};
    TABLE_COLUMNS.forEach(col => {
      allVisible[col.id] = true;
    });
    onColumnVisibilityChange(allVisible);
  }, [onColumnVisibilityChange]);

  const handleResetColumnsToDefaults = useCallback(() => {
    onColumnVisibilityChange({ ...DEFAULT_TABLE_COLUMN_VISIBILITY });
    onColumnOrderChange(getDefaultColumnOrder());
  }, [onColumnVisibilityChange, onColumnOrderChange]);

  // --- Column order drag-and-drop ---
  const columnSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const orderedColumns = useMemo(() => {
    // Map stored order to columns
    const ordered = columnOrder
      .map(id => TABLE_COLUMNS.find(col => col.id === id))
      .filter((col): col is TableColumnDef => col !== undefined);
    
    // Add any new columns not in the stored order
    TABLE_COLUMNS.forEach(col => {
      if (!columnOrder.includes(col.id)) {
        ordered.push(col);
      }
    });
    
    return ordered;
  }, [columnOrder]);

  const handleColumnDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.findIndex(id => id === active.id);
      const newIndex = columnOrder.findIndex(id => id === over.id);
      const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
      onColumnOrderChange(newOrder);
    }
  }, [columnOrder, onColumnOrderChange]);

  // --- Stages logic ---
  const [localStages, setLocalStages] = useState<LeadStage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  const stageSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleStageDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localStages.findIndex((s) => s.id === active.id);
      const newIndex = localStages.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(localStages, oldIndex, newIndex);
      setLocalStages(newOrder);
      await reorderStages(newOrder.map((s) => s.id));
    }
  }, [localStages, reorderStages]);

  const handleCreateStage = useCallback(async () => {
    if (!newStageName.trim()) return;
    setIsCreating(true);
    try {
      await createStage(newStageName.trim());
      setNewStageName('');
    } finally {
      setIsCreating(false);
    }
  }, [newStageName, createStage]);

  const handleDeleteStage = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteStage(id);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteStage]);

  // --- Sorting preferences ---
  const sortableColumns = useMemo(() => [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'created_at', label: 'Created' },
    { id: 'updated_at', label: 'Last Updated' },
    { id: 'company', label: 'Company' },
  ], []);

  // --- Presets logic ---
  const [newPresetName, setNewPresetName] = useState('');

  const handleSavePreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const newPreset: ViewPreset = {
      id: crypto.randomUUID(),
      name: newPresetName.trim(),
      viewMode,
      kanbanFields: [...visibleFields],
      tableColumns: { ...columnVisibility },
      tableColumnOrder: [...columnOrder],
      defaultSort,
    };

    const updated = [...presets, newPreset];
    onPresetsChange(updated);
    setNewPresetName('');
    toast.success(`Saved preset "${newPreset.name}"`);
  }, [newPresetName, viewMode, visibleFields, columnVisibility, columnOrder, defaultSort, presets, onPresetsChange]);

  const handleDeletePreset = useCallback((id: string) => {
    const updated = presets.filter(p => p.id !== id);
    onPresetsChange(updated);
    toast.success('Preset deleted');
  }, [presets, onPresetsChange]);

  const handleLoadPreset = useCallback((preset: ViewPreset) => {
    onApplyPreset(preset);
    toast.success(`Applied preset "${preset.name}"`);
    setActiveView('main');
  }, [onApplyPreset]);

  // --- Export logic ---
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS);
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState<Date | undefined>();
  const [customDateEnd, setCustomDateEnd] = useState<Date | undefined>();
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [useCurrentView, setUseCurrentView] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Reset export state when entering export view
  useEffect(() => {
    if (activeView === 'export') {
      setSelectedColumns(DEFAULT_COLUMNS);
      setSelectedStageIds(stages.map(s => s.id));
      setDateRange('all');
      setCustomDateStart(undefined);
      setCustomDateEnd(undefined);
      setIncludeHeaders(true);
      setUseCurrentView(false);
      setIsExporting(false);
    }
  }, [activeView, stages]);

  const previewCount = useMemo(() => {
    const stageOptions: ExportLeadStage[] = stages.map(s => ({ id: s.id, name: s.name, color: s.color }));
    const options: ExportOptions = {
      columns: selectedColumns,
      stageIds: selectedStageIds,
      stages: stageOptions,
      dateRange,
      customDateStart,
      customDateEnd,
      includeHeaders,
      useCurrentView,
    };
    const sourceLeads = useCurrentView ? filteredLeads : allLeads;
    return filterLeads(sourceLeads, options).length;
  }, [selectedColumns, selectedStageIds, stages, dateRange, customDateStart, customDateEnd, useCurrentView, allLeads, filteredLeads, includeHeaders]);

  const hasConversationColumns = useMemo(
    () => needsConversationMetadata(selectedColumns),
    [selectedColumns]
  );

  const handleExportColumnToggle = useCallback((column: ExportColumn) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  }, []);

  const handleExportSelectAll = useCallback(() => {
    setSelectedColumns([...ALL_COLUMNS]);
  }, []);

  const handleExportDeselectAll = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  const handleStageToggle = useCallback((stageId: string) => {
    setSelectedStageIds(prev =>
      prev.includes(stageId)
        ? prev.filter(s => s !== stageId)
        : [...prev, stageId]
    );
  }, []);

  const handleExport = useCallback(async () => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column to export');
      return;
    }

    setIsExporting(true);
    try {
      const stageOptions: ExportLeadStage[] = stages.map(s => ({ id: s.id, name: s.name, color: s.color }));
      const options: ExportOptions = {
        columns: selectedColumns,
        stageIds: selectedStageIds,
        stages: stageOptions,
        dateRange,
        customDateStart,
        customDateEnd,
        includeHeaders,
        useCurrentView,
      };

      const sourceLeads = useCurrentView ? filteredLeads : allLeads;
      let enrichedAllLeads: LeadWithMetadata[] = allLeads;
      let enrichedFilteredLeads: LeadWithMetadata[] = filteredLeads;

      if (hasConversationColumns) {
        const metadataMap = await fetchConversationMetadata(sourceLeads);
        enrichedAllLeads = enrichLeadsWithMetadata(allLeads, metadataMap);
        enrichedFilteredLeads = enrichLeadsWithMetadata(filteredLeads, metadataMap);
      }

      const result = exportLeads(enrichedAllLeads, enrichedFilteredLeads, options);

      if (result.success) {
        toast.success(`Successfully exported ${result.count} leads`);
        onOpenChange(false);
      } else {
        toast.error('No leads to export with the selected filters');
      }
    } catch (error: unknown) {
      console.error('Export failed:', error);
      toast.error('Failed to export leads');
    } finally {
      setIsExporting(false);
    }
  }, [selectedColumns, selectedStageIds, stages, dateRange, customDateStart, customDateEnd, includeHeaders, useCurrentView, allLeads, filteredLeads, hasConversationColumns, onOpenChange]);

  const canExport = selectedColumns.length > 0 && previewCount > 0 && !isExporting;

  // --- Navigation item component ---
  const NavItem = ({ icon: Icon, label, count, onClick }: { icon: React.ElementType; label: string; count?: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-lg group transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-muted-foreground" />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {count && <span className="text-sm text-muted-foreground">{count}</span>}
        <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );

  // --- Sub-view header component ---
  const SubViewHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-2 pb-4 border-b mb-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
        <ArrowLeft size={16} />
      </Button>
      <span className="font-semibold">{title}</span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:w-[440px] overflow-hidden flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle>Customize View</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            {/* Main View */}
            {activeView === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Default view preference */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Default View</Label>
                  <RadioGroup
                    value={defaultViewMode}
                    onValueChange={(value) => handleDefaultViewModeChange(value as 'kanban' | 'table')}
                    className="flex gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <RadioGroupItem value="kanban" id="view-kanban" />
                      <Label htmlFor="view-kanban" className="flex items-center gap-2 cursor-pointer text-sm">
                        <LayoutAlt04 size={16} className="text-muted-foreground" />
                        Board
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <RadioGroupItem value="table" id="view-table" />
                      <Label htmlFor="view-table" className="flex items-center gap-2 cursor-pointer text-sm">
                        <Rows03 size={16} className="text-muted-foreground" />
                        Table
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Current view indicator */}
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  {viewMode === 'kanban' ? (
                    <LayoutAlt04 size={20} className="text-muted-foreground" />
                  ) : (
                    <Rows03 size={20} className="text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {viewMode === 'kanban' ? 'Board View' : 'Table View'}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">(current)</span>
                </div>

                {/* Navigation items - view-aware */}
                <div className="space-y-1">
                  {viewMode === 'kanban' ? (
                    <NavItem
                      icon={LayoutGrid01}
                      label="Card Fields"
                      count={`${visibleFields.size} shown`}
                      onClick={() => setActiveView('fields')}
                    />
                  ) : (
                    <NavItem
                      icon={Columns03}
                      label="Table Columns"
                      count={`${visibleColumnsCount} shown`}
                      onClick={() => setActiveView('columns')}
                    />
                  )}
                  <NavItem
                    icon={List}
                    label="Pipeline Stages"
                    count={`${stages.length} stages`}
                    onClick={() => setActiveView('stages')}
                  />
                  <NavItem
                    icon={SwitchVertical01}
                    label="Default Sorting"
                    count={defaultSort ? `${sortableColumns.find(c => c.id === defaultSort.column)?.label || defaultSort.column} ${defaultSort.direction === 'asc' ? '↑' : '↓'}` : 'None'}
                    onClick={() => setActiveView('sorting')}
                  />
                  <NavItem
                    icon={Bookmark}
                    label="Saved Views"
                    count={`${presets.length} presets`}
                    onClick={() => setActiveView('presets')}
                  />
                  <NavItem
                    icon={Download01}
                    label="Export Leads"
                    count="CSV"
                    onClick={() => setActiveView('export')}
                  />
                </div>
              </motion.div>
            )}

            {/* Fields View */}
            {activeView === 'fields' && (
              <motion.div
                key="fields"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <SubViewHeader title="Card Fields" onBack={() => setActiveView('main')} />
                
                <p className="text-sm text-muted-foreground mb-4">
                  Choose which fields to display on Kanban cards
                </p>

                <div className="space-y-6">
                  {GROUP_ORDER.map((groupKey, groupIndex) => {
                    const fields = fieldsByGroup[groupKey];
                    if (!fields?.length) return null;
                    
                    return (
                      <div key={groupKey}>
                        {groupIndex > 0 && <Separator className="mb-6" />}
                        <div className="space-y-3">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {FIELD_GROUP_LABELS[groupKey]}
                          </h4>
                          <div className="space-y-2">
                            {fields.map((field) => {
                              const Icon = field.icon;
                              const isChecked = visibleFields.has(field.key);
                              
                              return (
                                <label
                                  key={field.key}
                                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => onToggleField(field.key)}
                                  />
                                  <Icon size={16} className="text-muted-foreground" />
                                  <span className="text-sm">{field.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex-1">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetToDefaults} className="flex-1">
                    Reset to Defaults
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Table Columns View */}
            {activeView === 'columns' && (
              <motion.div
                key="columns"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <SubViewHeader title="Table Columns" onBack={() => setActiveView('main')} />
                
                <p className="text-sm text-muted-foreground mb-4">
                  Drag to reorder columns. Toggle visibility with checkboxes.
                </p>

                <DndContext
                  sensors={columnSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleColumnDragEnd}
                >
                  <SortableContext
                    items={columnOrder}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {orderedColumns.map((column) => (
                        <SortableColumnItem
                          key={column.id}
                          column={column}
                          isVisible={columnVisibility[column.id] !== false}
                          onToggle={() => handleColumnToggle(column.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={handleSelectAllColumns} className="flex-1">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetColumnsToDefaults} className="flex-1">
                    Reset to Defaults
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Stages View */}
            {activeView === 'stages' && (
              <motion.div
                key="stages"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <SubViewHeader title="Pipeline Stages" onBack={() => setActiveView('main')} />

                <div className="space-y-3">
                  {stagesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <DndContext
                      sensors={stageSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleStageDragEnd}
                    >
                      <SortableContext
                        items={localStages.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {localStages.map((stage) => (
                            <SortableStageItem
                              key={stage.id}
                              stage={stage}
                              onUpdate={updateStage}
                              onDelete={handleDeleteStage}
                              isDeleting={isDeleting}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="New stage name..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateStage();
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCreateStage}
                    disabled={!newStageName.trim() || isCreating}
                    size="sm"
                  >
                    <Plus size={16} className="mr-1" />
                    Add
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Sorting View */}
            {activeView === 'sorting' && (
              <motion.div
                key="sorting"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <SubViewHeader title="Default Sorting" onBack={() => setActiveView('main')} />
                
                <p className="text-sm text-muted-foreground mb-4">
                  Set the default sort order when opening the Leads page
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sort by column</Label>
                    <Select
                      value={defaultSort?.column || '__none__'}
                      onValueChange={(value) => {
                        if (value === '__none__') {
                          onDefaultSortChange(null);
                        } else {
                          onDefaultSortChange({
                            column: value,
                            direction: defaultSort?.direction || 'desc',
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {sortableColumns.map(col => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {defaultSort && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Direction</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={defaultSort.direction === 'asc' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => onDefaultSortChange({ ...defaultSort, direction: 'asc' })}
                        >
                          <ChevronUp size={16} className="mr-1" />
                          Ascending
                        </Button>
                        <Button
                          variant={defaultSort.direction === 'desc' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => onDefaultSortChange({ ...defaultSort, direction: 'desc' })}
                        >
                          <ChevronDown size={16} className="mr-1" />
                          Descending
                        </Button>
                      </div>
                    </div>
                  )}

                  {defaultSort && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => onDefaultSortChange(null)}
                    >
                      Clear default sorting
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Presets View */}
            {activeView === 'presets' && (
              <motion.div
                key="presets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <SubViewHeader title="Saved Views" onBack={() => setActiveView('main')} />
                
                <p className="text-sm text-muted-foreground mb-4">
                  Save your current view settings as a preset for quick access
                </p>

                {presets.length > 0 ? (
                  <div className="space-y-2 mb-6">
                    {presets.map(preset => (
                      <div
                        key={preset.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        {preset.viewMode === 'kanban' ? (
                          <LayoutAlt04 size={16} className="text-muted-foreground" />
                        ) : (
                          <Rows03 size={16} className="text-muted-foreground" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{preset.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {preset.viewMode === 'kanban'
                              ? `${preset.kanbanFields.length} fields`
                              : `${Object.values(preset.tableColumns).filter(Boolean).length} columns`
                            }
                            {preset.defaultSort && ` • Sorted by ${preset.defaultSort.column}`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleLoadPreset(preset)}
                        >
                          Apply
                        </Button>
                        <IconButton
                          label="Delete preset"
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePreset(preset.id)}
                        >
                          <Trash01 size={14} />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground mb-6">
                    <Bookmark size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved views yet</p>
                  </div>
                )}

                <div className="pt-4 border-t space-y-3">
                  <Label className="text-sm font-medium">Save current view</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="Preset name..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePreset();
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSavePreset}
                      disabled={!newPresetName.trim()}
                      size="sm"
                    >
                      <Plus size={16} className="mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Export View */}
            {activeView === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <SubViewHeader title="Export Leads" onBack={() => setActiveView('main')} />

                <div className="space-y-6">
                  {/* Columns Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Columns to export</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleExportSelectAll} className="h-7 px-2 text-xs">
                          Select all
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleExportDeselectAll} className="h-7 px-2 text-xs">
                          Deselect all
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3">
                      {ALL_COLUMNS.map(column => (
                        <div key={column} className="flex items-center gap-2">
                          <Checkbox
                            id={`col-${column}`}
                            checked={selectedColumns.includes(column)}
                            onCheckedChange={() => handleExportColumnToggle(column)}
                          />
                          <Label htmlFor={`col-${column}`} className="text-sm font-normal cursor-pointer">
                            {COLUMN_LABELS[column]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Filter Section */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Filter leads</Label>
                    
                    {/* Stage Filter */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Stage</Label>
                      <div className="flex flex-wrap gap-2">
                        {stages.map(stage => (
                          <div
                            key={stage.id}
                            className={cn(
                              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors',
                              selectedStageIds.includes(stage.id)
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                            )}
                            onClick={() => handleStageToggle(stage.id)}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.name}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Date range</Label>
                      <Select value={dateRange} onValueChange={(value: typeof dateRange) => setDateRange(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All time</SelectItem>
                          <SelectItem value="7days">Last 7 days</SelectItem>
                          <SelectItem value="30days">Last 30 days</SelectItem>
                          <SelectItem value="90days">Last 90 days</SelectItem>
                          <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                      </Select>

                      {dateRange === 'custom' && (
                        <div className="flex gap-2 mt-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  'flex-1 justify-start text-left font-normal',
                                  !customDateStart && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {customDateStart ? format(customDateStart, 'PP') : 'Start date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={customDateStart}
                                onSelect={setCustomDateStart}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  'flex-1 justify-start text-left font-normal',
                                  !customDateEnd && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {customDateEnd ? format(customDateEnd, 'PP') : 'End date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={customDateEnd}
                                onSelect={setCustomDateEnd}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>

                    {/* Use Current View Toggle */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Export current search results only</Label>
                      <Switch
                        checked={useCurrentView}
                        onCheckedChange={setUseCurrentView}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Options */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Options</Label>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Include column headers</Label>
                      <Switch
                        checked={includeHeaders}
                        onCheckedChange={setIncludeHeaders}
                      />
                    </div>
                  </div>
                </div>

                {/* Export Footer */}
                <div className="mt-6 pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Leads to export:</span>
                    <span className="font-medium">{previewCount}</span>
                  </div>
                  <Button
                    onClick={handleExport}
                    disabled={!canExport}
                    className="w-full"
                  >
                    {isExporting ? 'Exporting...' : `Export ${previewCount} Leads`}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
