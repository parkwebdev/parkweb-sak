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
import { useTeam } from '@/hooks/useTeam';
import { useCanManage } from '@/hooks/useCanManage';
import { useAccountSettings } from '@/hooks/useAccountSettings';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadsHeaderBar } from '@/components/leads/LeadsHeaderBar';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { ExportLeadsDialog } from '@/components/leads/ExportLeadsDialog';
import { ManageStagesDialog } from '@/components/leads/ManageStagesDialog';
import { type SortOption } from '@/components/leads/LeadsViewSettingsSheet';
import { type CardFieldKey } from '@/components/leads/KanbanCardFields';
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
  const { getAssignees, addAssignee, removeAssignee, assigneesByLead } = useLeadAssignees();
  const { teamMembers } = useTeam();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Check if user can manage leads (delete, edit stage, etc.)
  const canManageLeads = useCanManage('manage_leads');
  
  // Account-wide settings from database
  const {
    viewMode,
    kanbanVisibleFields,
    tableColumnVisibility,
    tableColumnOrder,
    defaultSort,
    loading: settingsLoading,
    canManageSettings,
    updateSettings,
  } = useAccountSettings();
  
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

  // Settings update handlers (only available for account owners)
  const handleViewModeChange = useCallback((mode: 'kanban' | 'table') => {
    if (canManageSettings) {
      updateSettings({ leads_view_mode: mode });
    }
  }, [canManageSettings, updateSettings]);

  const handleColumnVisibilityChange = useCallback((visibility: VisibilityState) => {
    if (canManageSettings) {
      updateSettings({ leads_table_column_visibility: visibility });
    }
  }, [canManageSettings, updateSettings]);

  const handleDefaultSortChange = useCallback((sort: SortOption | null) => {
    if (canManageSettings) {
      updateSettings({ leads_default_sort: sort });
    }
  }, [canManageSettings, updateSettings]);

  const handleToggleField = useCallback((field: CardFieldKey) => {
    if (canManageSettings) {
      const currentFields = [...kanbanVisibleFields];
      const fieldIndex = currentFields.indexOf(field);
      if (fieldIndex >= 0) {
        currentFields.splice(fieldIndex, 1);
      } else {
        currentFields.push(field);
      }
      updateSettings({ leads_kanban_visible_fields: currentFields as CardFieldKey[] });
    }
  }, [canManageSettings, kanbanVisibleFields, updateSettings]);
  
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
        visibleCardFields={kanbanVisibleFields}
        onToggleCardField={handleToggleField}
        columnVisibility={tableColumnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onExport={() => setIsExportDialogOpen(true)}
        onManageStages={() => setIsManageStagesOpen(true)}
        canManage={canManageLeads}
      />

      <div className="px-4 lg:px-8 pt-4 space-y-6 min-w-0">

        {/* Content */}
        {loading || settingsLoading ? (
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
                  visibleFields={kanbanVisibleFields}
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
                  columnVisibility={tableColumnVisibility}
                  onColumnVisibilityChange={handleColumnVisibilityChange}
                  columnOrder={tableColumnOrder}
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
