/**
 * Leads Page
 * 
 * Manages leads captured from widget contact forms. Features include:
 * - Kanban and table view modes
 * - Search and status filtering
 * - Bulk selection and deletion
 * - Lead details sheet with conversation linkage
 * - Unified settings sheet for fields, stages, sorting, presets, and export
 * 
 * @page
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { useLeads } from '@/hooks/useLeads';
import { useLeadStages } from '@/hooks/useLeadStages';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { ViewModeToggle } from '@/components/leads/ViewModeToggle';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { 
  LeadsViewSettingsSheet,
  TABLE_VISIBILITY_STORAGE_KEY,
  DEFAULT_TABLE_COLUMN_VISIBILITY,
  TABLE_COLUMN_ORDER_STORAGE_KEY,
  DEFAULT_VIEW_MODE_STORAGE_KEY,
  DEFAULT_SORT_STORAGE_KEY,
  VIEW_PRESETS_STORAGE_KEY,
  getDefaultColumnOrder,
  TABLE_COLUMNS,
  type ViewPreset,
  type SortOption,
} from '@/components/leads/LeadsViewSettingsSheet';
import { type CardFieldKey, getDefaultVisibleFields, KANBAN_FIELDS_STORAGE_KEY, CARD_FIELDS } from '@/components/leads/KanbanCardFields';
import { Sliders02 } from '@untitledui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonLeadsPage } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';
import type { VisibilityState } from '@tanstack/react-table';

/** Props for the Leads page */
interface LeadsProps {
  /** Handler for mobile menu toggle */
  onMenuClick?: () => void;
}

function Leads({ onMenuClick }: LeadsProps) {
  const { leads, loading, updateLead, updateLeadOrders, deleteLead, deleteLeads, getLeadsWithConversations } = useLeads();
  const { stages } = useLeadStages();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Initialize view mode from localStorage
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_VIEW_MODE_STORAGE_KEY);
      if (stored === 'kanban' || stored === 'table') return stored;
    } catch {
      // fallback
    }
    return 'kanban';
  });
  
  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Single lead delete from details sheet
  const [singleDeleteLeadId, setSingleDeleteLeadId] = useState<string | null>(null);
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false);
  
  // Unified settings sheet state
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  
  // Kanban card field visibility state with localStorage persistence
  const [visibleCardFields, setVisibleCardFields] = useState<Set<CardFieldKey>>(() => {
    try {
      const stored = localStorage.getItem(KANBAN_FIELDS_STORAGE_KEY);
      if (stored) {
        return new Set(JSON.parse(stored) as CardFieldKey[]);
      }
    } catch {
      // Fallback to defaults on parse error
    }
    return getDefaultVisibleFields();
  });

  // Table column visibility state with localStorage persistence
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const stored = localStorage.getItem(TABLE_VISIBILITY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as VisibilityState;
      }
    } catch {
      // Fallback to defaults on parse error
    }
    return { ...DEFAULT_TABLE_COLUMN_VISIBILITY };
  });

  // Column order state with localStorage persistence
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(TABLE_COLUMN_ORDER_STORAGE_KEY);
      if (stored) {
        const parsedOrder = JSON.parse(stored) as string[];
        // Ensure all current columns are included (handles new columns added later)
        const allColumnIds = getDefaultColumnOrder();
        const missingColumns = allColumnIds.filter(id => !parsedOrder.includes(id));
        // Remove any obsolete columns that no longer exist
        const validOrder = parsedOrder.filter(id => allColumnIds.includes(id));
        return [...validOrder, ...missingColumns];
      }
    } catch {
      // Fallback to defaults
    }
    return getDefaultColumnOrder();
  });

  // Default sorting state with localStorage persistence
  const [defaultSort, setDefaultSort] = useState<SortOption | null>(() => {
    try {
      const stored = localStorage.getItem(DEFAULT_SORT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as SortOption;
      }
    } catch {
      // Fallback to null
    }
    return null;
  });

  // View presets state with localStorage persistence
  const [presets, setPresets] = useState<ViewPreset[]>(() => {
    try {
      const stored = localStorage.getItem(VIEW_PRESETS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as ViewPreset[];
      }
    } catch {
      // Fallback to empty array
    }
    return [];
  });

  const handleColumnVisibilityChange = useCallback((visibility: VisibilityState) => {
    setColumnVisibility(visibility);
    localStorage.setItem(TABLE_VISIBILITY_STORAGE_KEY, JSON.stringify(visibility));
  }, []);

  const handleColumnOrderChange = useCallback((order: string[]) => {
    setColumnOrder(order);
    localStorage.setItem(TABLE_COLUMN_ORDER_STORAGE_KEY, JSON.stringify(order));
  }, []);

  const handleDefaultSortChange = useCallback((sort: SortOption | null) => {
    setDefaultSort(sort);
    if (sort) {
      localStorage.setItem(DEFAULT_SORT_STORAGE_KEY, JSON.stringify(sort));
    } else {
      localStorage.removeItem(DEFAULT_SORT_STORAGE_KEY);
    }
  }, []);

  const handlePresetsChange = useCallback((newPresets: ViewPreset[]) => {
    setPresets(newPresets);
    localStorage.setItem(VIEW_PRESETS_STORAGE_KEY, JSON.stringify(newPresets));
  }, []);

  const handleApplyPreset = useCallback((preset: ViewPreset) => {
    // Apply view mode
    setViewMode(preset.viewMode);
    localStorage.setItem(DEFAULT_VIEW_MODE_STORAGE_KEY, preset.viewMode);
    
    // Validate and apply kanban fields - filter out any that no longer exist
    const validCardFieldKeys = CARD_FIELDS.map(f => f.key);
    const validKanbanFields = preset.kanbanFields.filter(field => 
      validCardFieldKeys.includes(field)
    );
    setVisibleCardFields(new Set(validKanbanFields.length > 0 ? validKanbanFields : getDefaultVisibleFields()));
    localStorage.setItem(KANBAN_FIELDS_STORAGE_KEY, JSON.stringify(validKanbanFields.length > 0 ? validKanbanFields : [...getDefaultVisibleFields()]));
    
    // Validate and apply table columns visibility
    const allColumnIds = TABLE_COLUMNS.map(col => col.id);
    const validTableColumns: VisibilityState = {};
    allColumnIds.forEach(id => {
      // Use preset value if valid, otherwise use default
      validTableColumns[id] = preset.tableColumns[id] ?? DEFAULT_TABLE_COLUMN_VISIBILITY[id] ?? false;
    });
    setColumnVisibility(validTableColumns);
    localStorage.setItem(TABLE_VISIBILITY_STORAGE_KEY, JSON.stringify(validTableColumns));
    
    // Validate and apply column order
    const validColumnOrder = preset.tableColumnOrder.filter(id => allColumnIds.includes(id));
    const missingColumns = allColumnIds.filter(id => !validColumnOrder.includes(id));
    const finalColumnOrder = [...validColumnOrder, ...missingColumns];
    setColumnOrder(finalColumnOrder);
    localStorage.setItem(TABLE_COLUMN_ORDER_STORAGE_KEY, JSON.stringify(finalColumnOrder));
    
    // Validate and apply sorting - ensure column still exists
    const validSortColumns = ['name', 'email', 'created_at', 'updated_at', 'company'];
    const validSort = preset.defaultSort && validSortColumns.includes(preset.defaultSort.column)
      ? preset.defaultSort
      : null;
    setDefaultSort(validSort);
    if (validSort) {
      localStorage.setItem(DEFAULT_SORT_STORAGE_KEY, JSON.stringify(validSort));
    } else {
      localStorage.removeItem(DEFAULT_SORT_STORAGE_KEY);
    }
  }, []);

  const handleToggleField = useCallback((field: CardFieldKey) => {
    setVisibleCardFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      localStorage.setItem(KANBAN_FIELDS_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);
  
  const handleSetFields = useCallback((fields: Set<CardFieldKey>) => {
    setVisibleCardFields(fields);
    localStorage.setItem(KANBAN_FIELDS_STORAGE_KEY, JSON.stringify([...fields]));
  }, []);
  
  // Shared search state for filtering across both views
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter leads based on search query (shared across views)
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    
    const query = searchQuery.toLowerCase();
    return leads.filter((lead) => {
      return (
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.company?.toLowerCase().includes(query)
      );
    });
  }, [leads, searchQuery]);

  const handleViewLead = useCallback((lead: Tables<'leads'>) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  }, [filteredLeads]);

  const handleSelectLead = useCallback((id: string, checked: boolean) => {
    setSelectedLeadIds(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      return newSelected;
    });
  }, []);

  const handleBulkDelete = useCallback(async (deleteConversations: boolean) => {
    setIsDeleting(true);
    try {
      await deleteLeads(Array.from(selectedLeadIds), deleteConversations);
      setSelectedLeadIds(new Set());
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteLeads, selectedLeadIds]);

  const handleSingleDelete = useCallback((leadId: string) => {
    setSingleDeleteLeadId(leadId);
    setIsSingleDeleteOpen(true);
  }, []);

  const handleSingleDeleteConfirm = useCallback(async (deleteConversation: boolean) => {
    if (!singleDeleteLeadId) return;
    setIsDeleting(true);
    try {
      await deleteLead(singleDeleteLeadId, deleteConversation);
      setSingleDeleteLeadId(null);
      setIsSingleDeleteOpen(false);
      setIsDetailsOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteLead, singleDeleteLeadId]);

  // Calculate stats based on dynamic stages
  const stageStats = useMemo(() => {
    return stages.map(stage => ({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      count: leads.filter(l => l.stage_id === stage.id).length,
    }));
  }, [stages, leads]);

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-muted/30 overflow-y-auto">
      <PageHeader
        title="Leads"
        description="Track and manage leads captured from conversations"
        onMenuClick={onMenuClick}
      />

      <div className="px-4 lg:px-8 mt-6 space-y-6 min-w-0">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 border rounded-lg bg-card">
            <div className="text-xl font-bold">{leads.length}</div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </div>
          {stageStats.slice(0, 4).map((stage) => (
            <div key={stage.id} className="p-4 border rounded-lg bg-card">
              <div className="text-xl font-bold" style={{ color: stage.color }}>
                {stage.count}
              </div>
              <div className="text-xs text-muted-foreground">{stage.name}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonLeadsPage />
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'kanban' ? (
              <motion.div
                key="kanban"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Kanban toolbar with search and view toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <ViewModeToggle
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                    <div className="relative w-full max-w-sm">
                      <input
                        type="text"
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2"
                    onClick={() => setIsSettingsSheetOpen(true)}
                  >
                    <Sliders02 size={16} />
                    <span className="hidden sm:inline">Customize</span>
                  </Button>
                </div>
                <LeadsKanbanBoard
                  leads={filteredLeads}
                  onStatusChange={(leadId, stageId) => updateLead(leadId, { stage_id: stageId })}
                  onViewLead={handleViewLead}
                  onOrderChange={updateLeadOrders}
                  visibleFields={visibleCardFields}
                />
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <LeadsTable
                  leads={filteredLeads}
                  selectedIds={selectedLeadIds}
                  onView={handleViewLead}
                  onStageChange={(leadId, stageId) => updateLead(leadId, { stage_id: stageId })}
                  onSelectionChange={handleSelectLead}
                  onSelectAll={handleSelectAll}
                  onBulkDelete={(ids) => {
                    setSelectedLeadIds(new Set(ids));
                    setIsDeleteDialogOpen(true);
                  }}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onOpenSettings={() => setIsSettingsSheetOpen(true)}
                  columnVisibility={columnVisibility}
                  onColumnVisibilityChange={handleColumnVisibilityChange}
                  columnOrder={columnOrder}
                  defaultSort={defaultSort}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!loading && leads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No leads captured yet. Leads are automatically added when visitors submit the contact form in your widget.
          </div>
        )}
      </div>

      {/* Dialogs */}
      <LeadDetailsSheet
        lead={selectedLead}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onUpdate={updateLead}
        onDelete={handleSingleDelete}
      />

      <DeleteLeadDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        leadIds={Array.from(selectedLeadIds)}
        hasConversations={getLeadsWithConversations(Array.from(selectedLeadIds))}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
      />

      <DeleteLeadDialog
        open={isSingleDeleteOpen}
        onOpenChange={setIsSingleDeleteOpen}
        leadIds={singleDeleteLeadId ? [singleDeleteLeadId] : []}
        hasConversations={singleDeleteLeadId ? getLeadsWithConversations([singleDeleteLeadId]) : false}
        onConfirm={handleSingleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <LeadsViewSettingsSheet
        open={isSettingsSheetOpen}
        onOpenChange={setIsSettingsSheetOpen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        visibleFields={visibleCardFields}
        onToggleField={handleToggleField}
        onSetFields={handleSetFields}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        columnOrder={columnOrder}
        onColumnOrderChange={handleColumnOrderChange}
        defaultSort={defaultSort}
        onDefaultSortChange={handleDefaultSortChange}
        presets={presets}
        onPresetsChange={handlePresetsChange}
        onApplyPreset={handleApplyPreset}
        allLeads={leads}
        filteredLeads={filteredLeads}
      />
    </div>
  );
};

export default Leads;
