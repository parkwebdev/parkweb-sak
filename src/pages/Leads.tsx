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

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteLeads } from '@/hooks/useInfiniteLeads';
import { useAutomations } from '@/hooks/useAutomations';
import { triggerAutomation } from '@/lib/trigger-automation';
import { Loading02 } from '@untitledui/icons';
import { useLeadStages } from '@/hooks/useLeadStages';
import { useLeadAssignees } from '@/hooks/useLeadAssignees';
import { useTeam } from '@/hooks/useTeam';
import { useCanManage } from '@/hooks/useCanManage';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadsHeaderBar } from '@/components/leads/LeadsHeaderBar';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { ExportLeadsDialog } from '@/components/leads/ExportLeadsDialog';
import { ManageStagesDialog } from '@/components/leads/ManageStagesDialog';
import { RunAutomationDialog } from '@/components/automations/RunAutomationDialog';
import { type SortOption } from '@/components/leads/LeadsViewSettingsSheet';
import { type CardFieldKey, getDefaultVisibleFields, CARD_FIELDS } from '@/components/leads/KanbanCardFields';
import { type DateRangeFilter } from '@/components/leads/LeadsActiveFilters';
import { SkeletonLeadsPage } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import type { Tables, Json } from '@/integrations/supabase/types';
import type { VisibilityState } from '@tanstack/react-table';
import type { ConversationMetadata } from '@/types/metadata';
import type { AutomationListItem, TriggerManualConfig } from '@/types/automations';

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

/** Props for the Leads page */
interface LeadsProps {
  /** Handler for mobile menu toggle */
  onMenuClick?: () => void;
}

// Date filter day ranges
const DATE_FILTER_DAYS: Record<Exclude<DateRangeFilter, 'all'>, number> = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
};

function Leads({ onMenuClick }: LeadsProps) {
  const { 
    leads, 
    loading, 
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    updateLead, 
    updateLeadOrders, 
    deleteLead, 
    deleteLeads, 
    getLeadsWithConversations 
  } = useInfiniteLeads();
  
  // Infinite scroll intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const { stages } = useLeadStages();
  const { getAssignees, addAssignee, removeAssignee, assigneesByLead } = useLeadAssignees();
  const { teamMembers } = useTeam();
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Fetch manual automations for running on leads
  const { automations: allAutomations } = useAutomations();
  const manualAutomations = useMemo(() => 
    allAutomations.filter(a => a.trigger_type === 'manual' && a.enabled),
    [allAutomations]
  );
  
  // State for running automation on a lead
  const [automationToRun, setAutomationToRun] = useState<AutomationListItem | null>(null);
  const [leadForAutomation, setLeadForAutomation] = useState<{ id: string; name: string } | null>(null);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [triggering, setTriggering] = useState(false);
  
  // Check if user can manage leads (delete, edit stage, etc.)
  const canManageLeads = useCanManage('manage_leads');

  // Handle priority change from table dropdown
  const handlePriorityChange = useCallback(async (leadId: string, conversationId: string, priority: string) => {
    // Fetch current conversation metadata
    const { data: conversation } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversationId)
      .single();

    const currentMetadata = (conversation?.metadata || {}) as ConversationMetadata;
    const newPriority = priority === 'none' ? undefined : priority;
    const newMetadata = { ...currentMetadata, priority: newPriority };

    await supabase
      .from('conversations')
      .update({ metadata: newMetadata as unknown as Json })
      .eq('id', conversationId);

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: queryKeys.leads.all });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [queryClient]);
  
  // Per-user view mode preference (localStorage)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      if (stored === 'table' || stored === 'kanban') return stored;
    } catch (e: unknown) {
      console.warn('Failed to read view mode from localStorage:', e);
    }
    return 'kanban';
  });

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

  // Settings update handlers (per-user localStorage)
  const handleViewModeChange = useCallback((mode: 'kanban' | 'table') => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

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
  
  // Shared search state for filtering across both views
  const [searchQuery, setSearchQuery] = useState('');
  
  // Stage filter state
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  
  // Assignee filter state
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  
  // Date range filter state
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  
  // Find the default stage for leads without a stage_id
  const defaultStage = stages.find(s => s.is_default);
  
  // Filter leads based on search query, stage filter, and date range
  const filteredLeads = useMemo(() => {
    let result = leads;
    
    // Stage filter - treat null stage_id as the default stage
    if (selectedStageIds.length > 0) {
      result = result.filter(lead => {
        const effectiveStageId = lead.stage_id ?? defaultStage?.id;
        return effectiveStageId && selectedStageIds.includes(effectiveStageId);
      });
    }
    
    // Assignee filter
    if (selectedAssigneeIds.length > 0) {
      result = result.filter(lead => {
        const leadAssignees = assigneesByLead[lead.id] || [];
        return selectedAssigneeIds.some(id => leadAssignees.includes(id));
      });
    }
    
    // Date range filter
    if (dateRangeFilter !== 'all') {
      const daysAgo = DATE_FILTER_DAYS[dateRangeFilter];
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
  }, [leads, selectedStageIds, selectedAssigneeIds, assigneesByLead, dateRangeFilter, searchQuery, defaultStage?.id]);

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

  const handleOpenBulkDelete = useCallback((ids: string[]) => {
    setSelectedLeadIds(new Set(ids));
    setIsDeleteDialogOpen(true);
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

  // Handle running automation on a lead
  const handleRunAutomationOnLead = useCallback((automationId: string, leadId: string, leadName: string) => {
    const automation = manualAutomations.find(a => a.id === automationId);
    if (!automation) return;
    
    const config = automation.trigger_config as TriggerManualConfig;
    
    if (config?.requireConfirmation) {
      setAutomationToRun(automation);
      setLeadForAutomation({ id: leadId, name: leadName });
      setRunDialogOpen(true);
    } else {
      // Run immediately without confirmation - call edge function directly
      setTriggering(true);
      triggerAutomation({ automationId, leadId }).finally(() => {
        setTriggering(false);
      });
    }
  }, [manualAutomations]);

  const handleConfirmRunOnLead = useCallback(async () => {
    if (!automationToRun || !leadForAutomation) return;
    setTriggering(true);
    await triggerAutomation({ 
      automationId: automationToRun.id, 
      leadId: leadForAutomation.id 
    });
    setTriggering(false);
    setRunDialogOpen(false);
    setAutomationToRun(null);
    setLeadForAutomation(null);
  }, [automationToRun, leadForAutomation]);

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-muted/30 overflow-y-auto">

      {/* Header bar - outside content padding for full-width effect */}
      <LeadsHeaderBar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stages={stages}
        selectedStageIds={selectedStageIds}
        onStageFilterChange={setSelectedStageIds}
        dateRange={dateRangeFilter}
        onDateRangeChange={setDateRangeFilter}
        teamMembers={teamMembers}
        selectedAssigneeIds={selectedAssigneeIds}
        onAssigneeFilterChange={setSelectedAssigneeIds}
        sortOption={defaultSort}
        onSortChange={handleDefaultSortChange}
        visibleCardFields={visibleCardFields}
        onToggleCardField={handleToggleField}
        kanbanFieldOrder={kanbanFieldOrder}
        onKanbanFieldOrderChange={handleKanbanFieldOrderChange}
        columnVisibility={tableColumnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        tableColumnOrder={tableColumnOrder}
        onColumnOrderChange={handleColumnOrderChange}
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
                  fieldOrder={kanbanFieldOrder}
                  canManage={canManageLeads}
                  sortOption={defaultSort}
                  manualAutomations={manualAutomations}
                  onRunAutomation={handleRunAutomationOnLead}
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
                  onPriorityChange={canManageLeads ? handlePriorityChange : undefined}
                  onAddAssignee={canManageLeads ? addAssignee : undefined}
                  onRemoveAssignee={canManageLeads ? removeAssignee : undefined}
                  getAssignees={getAssignees}
                  onSelectionChange={canManageLeads ? handleSelectLead : undefined}
                  onSelectAll={canManageLeads ? handleSelectAll : undefined}
                  onBulkDelete={canManageLeads ? handleOpenBulkDelete : undefined}
                  columnVisibility={tableColumnVisibility}
                  onColumnVisibilityChange={handleColumnVisibilityChange}
                  columnOrder={tableColumnOrder}
                  defaultSort={defaultSort}
                  canManage={canManageLeads}
                  isLoading={isFetchingNextPage}
                  manualAutomations={manualAutomations}
                  onRunAutomation={handleRunAutomationOnLead}
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
        
        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-4" aria-hidden="true" />
        
        {/* Loading indicator for infinite scroll */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loading02 size={20} className="animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Loading more leads</span>
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

      <RunAutomationDialog
        open={runDialogOpen}
        onOpenChange={setRunDialogOpen}
        automation={automationToRun}
        onRun={handleConfirmRunOnLead}
        running={triggering}
        leadContext={leadForAutomation}
      />

    </div>
  );
};

export default Leads;
