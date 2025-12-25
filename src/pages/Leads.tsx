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
import { LayoutAlt04, List } from '@untitledui/icons';
import { useLeads } from '@/hooks/useLeads';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadsToolbar } from '@/components/leads/LeadsToolbar';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonLeadsPage } from '@/components/ui/skeleton';
import type { Tables, Enums } from '@/integrations/supabase/types';

/** Props for the Leads page */
interface LeadsProps {
  /** Handler for mobile menu toggle */
  onMenuClick?: () => void;
}

const Leads: React.FC<LeadsProps> = ({ onMenuClick }) => {
  const { leads, loading, createLead, updateLead, updateLeadOrders, deleteLead, deleteLeads, getLeadsWithConversations } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  
  // Shared filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Single lead delete from details sheet
  const [singleDeleteLeadId, setSingleDeleteLeadId] = useState<string | null>(null);
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false);

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

  const handleExport = useCallback(() => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Company', 'Status', 'Created'],
      ...filteredLeads.map((lead) => [
        lead.name || '',
        lead.email || '',
        lead.phone || '',
        lead.company || '',
        lead.status,
        new Date(lead.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString()}.csv`;
    a.click();
  }, [filteredLeads]);

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

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 bg-muted/30 overflow-y-auto">
      <PageHeader
        title="Leads"
        description="Track and manage leads captured from conversations"
        onMenuClick={onMenuClick}
      >
        <Button variant="outline" size="sm" onClick={handleExport} disabled={leads.length === 0}>
          Export
        </Button>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Add Lead
        </Button>
      </PageHeader>

      <div className="px-4 lg:px-8 mt-6 space-y-6 min-w-0">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-xl font-bold text-blue-500">{stats.new}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-xl font-bold text-purple-500">{stats.contacted}</div>
            <div className="text-xs text-muted-foreground">Contacted</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-xl font-bold text-green-500">{stats.qualified}</div>
            <div className="text-xs text-muted-foreground">Qualified</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-xl font-bold text-success">{stats.converted}</div>
            <div className="text-xs text-muted-foreground">Converted</div>
          </div>
        </div>

        {/* Shared Search */}
        <LeadsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

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
                {/* View toggle for Kanban */}
                <div className="flex justify-end">
                  <div className="flex border rounded-lg">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setViewMode('kanban')}
                      aria-label="Kanban view"
                    >
                      <LayoutAlt04 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('table')}
                      aria-label="Table view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <LeadsKanbanBoard
                  leads={filteredLeads}
                  onStatusChange={(leadId, status) => updateLead(leadId, { status })}
                  onViewLead={handleViewLead}
                  onOrderChange={updateLeadOrders}
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
                  onStatusChange={(leadId, status) => updateLead(leadId, { status: status as Enums<'lead_status'> })}
                  onSelectionChange={handleSelectLead}
                  onSelectAll={handleSelectAll}
                  onBulkDelete={(ids) => {
                    setSelectedLeadIds(new Set(ids));
                    setIsDeleteDialogOpen(true);
                  }}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
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
    </div>
  );
};

export default Leads;
