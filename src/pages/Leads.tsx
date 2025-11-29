import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download01, Grid01, List, SearchLg, Menu01 as Menu } from '@untitledui/icons';
import { useLeads } from '@/hooks/useLeads';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadDetailsSheet } from '@/components/leads/LeadDetailsSheet';
import { CreateLeadDialog } from '@/components/leads/CreateLeadDialog';
import type { Tables } from '@/integrations/supabase/types';

const Leads: React.FC = () => {
  const { leads, loading, createLead, updateLead, deleteLead } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Tables<'leads'> | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

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

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
  };

  return (
    <div className="h-full overflow-auto pt-4 lg:pt-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-sm font-semibold text-foreground">Leads</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Track and manage leads captured from conversations
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} disabled={filteredLeads.length === 0}>
                Export
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                Add Lead
              </Button>
            </div>
          </div>
        </div>
      </header>

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

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading leads...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onView={handleViewLead} />
            ))}
          </div>
        ) : (
          <LeadsTable
            leads={filteredLeads}
            onView={handleViewLead}
            onStatusChange={(leadId, status) => updateLead(leadId, { status: status as any })}
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
        onDelete={deleteLead}
      />

      <CreateLeadDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={async (lead) => {
          await createLead(lead);
        }}
      />
    </div>
  );
};

export default Leads;
