/**
 * Leads Page
 * 
 * Manages leads captured from widget contact forms. Features include:
 * - Grid and table view modes
 * - Search and status filtering
 * - Bulk selection and deletion
 * - Lead details sheet with conversation linkage
 * - CSV export functionality
 * 
 * @page
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLeads } from '@/hooks/useLeads';
import { useLeadStages } from '@/hooks/useLeadStages';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { ViewModeToggle } from '@/components/leads/ViewModeToggle';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { ExportLeadsDialog } from '@/components/leads/ExportLeadsDialog';
import { ManageStagesDialog } from '@/components/leads/ManageStagesDialog';
import { KanbanCardFieldsFilter } from '@/components/leads/KanbanCardFieldsFilter';
import { type CardFieldKey, getDefaultVisibleFields, KANBAN_FIELDS_STORAGE_KEY } from '@/components/leads/KanbanCardFields';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonLeadsPage } from '@/components/ui/skeleton';
import { Settings01 } from '@untitledui/icons';
import type { Tables } from '@/integrations/supabase/types';

/** Props for the Leads page */
interface LeadsProps {
  /** Handler for mobile menu toggle */
  onMenuClick?: () => void;
}

const Leads: React.FC<LeadsProps> = ({ onMenuClick }) => {
  const { leads, loading, createLead, updateLead, updateLeadOrders, deleteLead, deleteLeads, getLeadsWithConversations } = useLeads();
  const { stages } = useLeadStages();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  
  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Single lead delete from details sheet
  const [singleDeleteLeadId, setSingleDeleteLeadId] = useState<string | null>(null);
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false);
  
  // Export dialog state
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // Manage stages dialog state
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
      >
        <Button variant="outline" size="sm" onClick={() => setIsExportOpen(true)} disabled={leads.length === 0}>
          Export
        </Button>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Add Lead
        </Button>
      </PageHeader>

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
                  <div className="flex items-center gap-2">
                    <KanbanCardFieldsFilter
                      visibleFields={visibleCardFields}
                      onToggleField={handleToggleField}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconButton
                            label="Manage stages"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsManageStagesOpen(true)}
                          >
                            <Settings01 size={16} />
                          </IconButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Manage pipeline stages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <ViewModeToggle
                      viewMode={viewMode}
                      onViewModeChange={setViewMode}
                    />
                  </div>
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
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!loading && leads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No leads found. Create your first lead to get started.
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

      <CreateLeadDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={async (lead) => {
          await createLead(lead);
        }}
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
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        allLeads={leads}
        filteredLeads={filteredLeads}
      />

      <ManageStagesDialog
        open={isManageStagesOpen}
        onOpenChange={setIsManageStagesOpen}
      />
    </div>
  );
};

export default Leads;
