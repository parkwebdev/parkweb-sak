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

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutAlt04, List, SearchLg, Trash01, XClose } from '@untitledui/icons';
import { useLeads } from '@/hooks/useLeads';
import { LeadsKanbanBoard } from '@/components/leads/LeadsKanbanBoard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import type { Tables, Enums } from '@/integrations/supabase/types';

/** Props for the Leads page */
interface LeadsProps {
  /** Handler for mobile menu toggle */
  onMenuClick?: () => void;
}

const Leads: React.FC<LeadsProps> = ({ onMenuClick }) => {
  const { leads, loading, createLead, updateLead, deleteLead, deleteLeads, getLeadsWithConversations } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  
  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Single lead delete from details sheet
  const [singleDeleteLeadId, setSingleDeleteLeadId] = useState<string | null>(null);
  const [isSingleDeleteOpen, setIsSingleDeleteOpen] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      (lead.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.company?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewLead = (lead: Tables<'leads'>) => {
    console.log('handleViewLead called with:', lead);
    console.log('Current selectedLead:', selectedLead);
    console.log('Current isDetailsOpen:', isDetailsOpen);
    setSelectedLead(lead);
    setIsDetailsOpen(true);
    console.log('After setting - isDetailsOpen should be true');
  };

  const handleExport = () => {
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
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleSelectLead = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedLeadIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedLeadIds(newSelected);
  };

  const handleBulkDelete = async (deleteConversations: boolean) => {
    setIsDeleting(true);
    try {
      await deleteLeads(Array.from(selectedLeadIds), deleteConversations);
      setSelectedLeadIds(new Set());
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = (leadId: string) => {
    setSingleDeleteLeadId(leadId);
    setIsSingleDeleteOpen(true);
  };

  const handleSingleDeleteConfirm = async (deleteConversation: boolean) => {
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
  };

  const clearSelection = () => {
    setSelectedLeadIds(new Set());
  };

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  };

  return (
    <main className="flex-1 bg-muted/30 h-screen overflow-y-auto overflow-x-hidden">
      <PageHeader
        title="Leads"
        description="Track and manage leads captured from conversations"
        onMenuClick={onMenuClick}
      >
        <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredLeads.length === 0}>
          Export
        </Button>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Add Lead
        </Button>
      </PageHeader>

      <div className="px-4 lg:px-8 mt-6 space-y-6">
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 items-center">
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="contacted">Contacted</TabsTrigger>
                <TabsTrigger value="qualified">Qualified</TabsTrigger>
                <TabsTrigger value="converted">Converted</TabsTrigger>
                <TabsTrigger value="lost">Lost</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                aria-label="Kanban view"
              >
                <LayoutAlt04 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedLeadIds.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
            <span className="text-sm font-medium">
              {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                <XClose className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash01 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState text="Loading leads..." />
        ) : viewMode === 'kanban' ? (
          <LeadsKanbanBoard
            leads={filteredLeads}
            onStatusChange={(leadId, status) => updateLead(leadId, { status })}
            onViewLead={handleViewLead}
          />
        ) : (
          <LeadsTable
            leads={filteredLeads}
            selectedIds={selectedLeadIds}
            onView={handleViewLead}
            onStatusChange={(leadId, status) => updateLead(leadId, { status: status as Enums<'lead_status'> })}
            onSelectionChange={handleSelectLead}
            onSelectAll={handleSelectAll}
          />
        )}

        {!loading && filteredLeads.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No leads found. Create your first lead or adjust your filters.
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
    </main>
  );
};

export default Leads;
