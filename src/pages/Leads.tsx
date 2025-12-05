import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid01, List, SearchLg, Trash01, XClose } from '@untitledui/icons';
import { useLeads } from '@/hooks/useLeads';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import { DeleteLeadDialog } from '@/components/leads/DeleteLeadDialog';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import type { Tables } from '@/integrations/supabase/types';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

interface LeadsProps {
  onMenuClick?: () => void;
}

const Leads: React.FC<LeadsProps> = ({ onMenuClick }) => {
  const { leads, loading, createLead, updateLead, deleteLead, deleteLeads, getLeadsWithConversations } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
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
    setSelectedLead(lead);
    setIsDetailsOpen(true);
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
    <main className="flex-1 bg-muted/30 h-screen overflow-auto">
      <PageHeader
        title="Leads"
        description="Track and manage leads captured from conversations"
        onMenuClick={onMenuClick}
      >
        <Button variant="outline" onClick={handleExport} disabled={filteredLeads.length === 0}>
          Export
        </Button>
        <Button onClick={() => setIsCreateOpen(true)}>
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
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid01 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
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
        ) : viewMode === 'grid' ? (
          <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.06}>
            {filteredLeads.map((lead) => (
              <AnimatedItem key={lead.id}>
                <LeadCard lead={lead} onView={handleViewLead} />
              </AnimatedItem>
            ))}
          </AnimatedList>
        ) : (
          <LeadsTable
            leads={filteredLeads}
            selectedIds={selectedLeadIds}
            onView={handleViewLead}
            onStatusChange={(leadId, status) => updateLead(leadId, { status: status as any })}
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
