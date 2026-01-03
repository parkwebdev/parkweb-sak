/**
 * Leads Page
 * 
 * Manages leads captured from widget contact forms. Features include:
 * - Kanban and table view modes
 * - Search and status filtering
 * - Bulk selection and deletion
 * - Lead details sheet with conversation linkage
 * - Inline display settings via header bar dropdowns
 * 
 * @page
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLeads } from '@/hooks/useLeads';
import { useLeadStages } from '@/hooks/useLeadStages';
import { useLeadAssignees } from '@/hooks/useLeadAssignees';
import { useCanManage } from '@/hooks/useCanManage';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadsHeaderBar } from '@/components/leads/LeadsHeaderBar';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { ExportLeadsDialog } from '@/components/leads/ExportLeadsDialog';
import { ManageStagesDialog } from '@/components/leads/ManageStagesDialog';
import { 
  TABLE_VISIBILITY_STORAGE_KEY,
  DEFAULT_TABLE_COLUMN_VISIBILITY,
  TABLE_COLUMN_ORDER_STORAGE_KEY,
  DEFAULT_VIEW_MODE_STORAGE_KEY,
  DEFAULT_SORT_STORAGE_KEY,
  getDefaultColumnOrder,
  type SortOption,
} from '@/components/leads/LeadsViewSettingsSheet';
import { type CardFieldKey, getDefaultVisibleFields, KANBAN_FIELDS_STORAGE_KEY } from '@/components/leads/KanbanCardFields';
import { type DateRangeFilter } from '@/components/leads/LeadsActiveFilters';
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
  const { getAssignees, addAssignee, removeAssignee } = useLeadAssignees();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Check if user can manage leads (delete, edit stage, etc.)
  const canManageLeads = useCanManage('manage_leads');
  
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
  
  // Dialog states for action buttons
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isManageStagesOpen, setIsManageStagesOpen] = useState(false);
  
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

  const handleColumnVisibilityChange = useCallback((visibility: VisibilityState) => {
    setColumnVisibility(visibility);
    localStorage.setItem(TABLE_VISIBILITY_STORAGE_KEY, JSON.stringify(visibility));
  }, []);

  const handleDefaultSortChange = useCallback((sort: SortOption | null) => {
    setDefaultSort(sort);
    if (sort) {
      localStorage.setItem(DEFAULT_SORT_STORAGE_KEY, JSON.stringify(sort));
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
  
  // Shared search state for filtering across both views
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stage filter state
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  
  // Date range filter state
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  
  // Filter leads based on search query, stage filter, and date range
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    // Stage filter
    if (selectedStageIds.length > 0) {
      result = result.filter(lead => lead.stage_id && selectedStageIds.includes(lead.stage_id));
    }
    
    // Date range filter
    if (dateRangeFilter !== 'all') {
      const daysAgo = { '7days': 7, '30days': 30, '90days': 90 }[dateRangeFilter];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysAgo);
      result = result.filter(lead => new Date(lead.created_at) >= cutoff);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((lead) => {
        return (
          lead.name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.toLowerCase().includes(query) ||
          lead.company?.toLowerCase().includes(query)
        );
      });
    }
    
    return result;
  }, [leads, selectedStageIds, dateRangeFilter, searchQuery]);

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

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-muted/30 overflow-y-auto">

      {/* Header bar - outside content padding for full-width effect */}
      <LeadsHeaderBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stages={stages}
        selectedStageIds={selectedStageIds}
        onStageFilterChange={setSelectedStageIds}
        dateRange={dateRangeFilter}
        onDateRangeChange={setDateRangeFilter}
        sortOption={defaultSort}
        onSortChange={handleDefaultSortChange}
        visibleCardFields={visibleCardFields}
        onToggleCardField={handleToggleField}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onExport={() => setIsExportDialogOpen(true)}
        onManageStages={() => setIsManageStagesOpen(true)}
        canManage={canManageLeads}
      />

      <div className="px-4 lg:px-8 pt-4 space-y-6 min-w-0">

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
              >
                <LeadsKanbanBoard
                  leads={filteredLeads}
                  onStatusChange={canManageLeads ? (leadId, stageId) => updateLead(leadId, { stage_id: stageId }) : () => {}}
                  onViewLead={handleViewLead}
                  onOrderChange={canManageLeads ? updateLeadOrders : undefined}
                  onAddAssignee={canManageLeads ? addAssignee : undefined}
                  onRemoveAssignee={canManageLeads ? removeAssignee : undefined}
                  getAssignees={getAssignees}
                  visibleFields={visibleCardFields}
                  canManage={canManageLeads}
                  sortOption={defaultSort}
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
                  onStageChange={canManageLeads ? (leadId, stageId) => updateLead(leadId, { stage_id: stageId }) : undefined}
                  onAddAssignee={canManageLeads ? addAssignee : undefined}
                  onRemoveAssignee={canManageLeads ? removeAssignee : undefined}
                  getAssignees={getAssignees}
                  onSelectionChange={canManageLeads ? handleSelectLead : undefined}
                  onSelectAll={canManageLeads ? handleSelectAll : undefined}
                  onBulkDelete={canManageLeads ? (ids) => {
                    setSelectedLeadIds(new Set(ids));
                    setIsDeleteDialogOpen(true);
                  } : undefined}
                  columnVisibility={columnVisibility}
                  onColumnVisibilityChange={handleColumnVisibilityChange}
                  columnOrder={columnOrder}
                  defaultSort={defaultSort}
                  canManage={canManageLeads}
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
        onDelete={canManageLeads ? handleSingleDelete : undefined}
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

      <ExportLeadsDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        allLeads={leads}
        filteredLeads={filteredLeads}
      />

      <ManageStagesDialog
        open={isManageStagesOpen}
        onOpenChange={setIsManageStagesOpen}
        canManage={canManageLeads}
      />

    </div>
  );
};

export default Leads;
