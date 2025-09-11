import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Eye, 
  Edit01 as Edit, 
  Trash01 as Trash, 
  Settings01 as Settings,
  ArrowsDown as ArrowUpDown,
  DotsGrid as Columns,
  FilterLines as Filter,
  Folder,
  Building01 as Building,
  Upload01 as Upload
} from "@untitledui/icons";
import { useClients, Client } from "@/hooks/useClients";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { CSVImportDialog } from "./CSVImportDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface ClientsTableProps {}

export const ClientsTable: React.FC<ClientsTableProps> = () => {
  const { clients, loading, refetch } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState({
    industries: [] as string[],
    statuses: [] as string[]
  });
  const [showColumns, setShowColumns] = useState({
    client: true,
    company: true,
    industry: true,
    status: true,
    requests: true,
    lastActivity: true,
    actions: true,
  });

  const statusTabs = [
    { key: 'all', label: 'All', count: clients.length },
    { key: 'active', label: 'Active', count: clients.filter(c => c.status === 'active').length },
    { key: 'inactive', label: 'Inactive', count: clients.filter(c => c.status === 'inactive').length },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get unique values for filters
  const uniqueIndustries = Array.from(new Set(clients.map(c => c.industry).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(clients.map(c => c.status)));
  
  const filteredClients = clients.filter(client => {
    // Status filter
    if (activeStatus !== 'all' && client.status !== activeStatus) return false;
    
    // Industry filter
    if (activeFilters.industries.length > 0 && !activeFilters.industries.includes(client.industry)) return false;
    
    // Status filter
    if (activeFilters.statuses.length > 0 && !activeFilters.statuses.includes(client.status)) return false;
    
    return true;
  });

  // Apply sorting
  const sortedClients = [...filteredClients].sort((a, b) => {
    if (!sortBy) return 0;
    
    let aVal: any, bVal: any;
    switch (sortBy) {
      case 'lastActivity':
        aVal = new Date(a.last_activity);
        bVal = new Date(b.last_activity);
        break;
      case 'company':
        aVal = a.company.toLowerCase();
        bVal = b.company.toLowerCase();
        break;
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'totalRequests':
        aVal = a.total_requests;
        bVal = b.total_requests;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleClientClick = (client: Client) => {
    navigate(`/clients/${client.id}`);
  };

  const handleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map(c => c.id));
    }
  };

  const handleSelectClient = (id: string) => {
    setSelectedClientIds(prev => 
      prev.includes(id) 
        ? prev.filter(clientId => clientId !== id)
        : [...prev, id]
    );
  };

  const handleFilterChange = (filterType: keyof typeof activeFilters, value: string, checked: boolean) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      industries: [],
      statuses: []
    });
    setSortBy("");
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8 text-muted-foreground">Loading clients...</div>;
  }

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header with Filters and Controls */}
      <header className="w-full border-b border-border">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 px-4 py-3">
          {/* Status tabs - scrollable on mobile */}
          <div className="overflow-x-auto">
            <div className="border shadow-sm flex overflow-hidden text-xs text-foreground font-medium leading-none rounded-md border-border min-w-max">
              {statusTabs.map((tab, index) => {
                const tabCount = tab.key === 'all' ? sortedClients.length : sortedClients.filter(c => c.status === tab.key).length;
                const isActive = activeStatus === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveStatus(tab.key)}
                    className={`justify-center items-center flex min-h-8 gap-1.5 px-2.5 py-1.5 transition-colors whitespace-nowrap ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent/50'
                    } ${index < statusTabs.length - 1 ? 'border-r-border border-r border-solid' : ''}`}
                  >
                    <div className="text-xs leading-4 self-stretch my-auto">
                      {tab.label}
                    </div>
                    {tabCount > 0 && (
                      <div className={`px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {tabCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
            {/* Controls */}
            <div className="flex items-center gap-2.5 ml-auto">
              {/* Bulk Actions */}
              {selectedClientIds.length > 0 && (
                <button
                  onClick={() => {}}
                  className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50 h-8 mr-2"
                >
                  <Folder size={14} />
                  Move to Folder ({selectedClientIds.length})
                </button>
              )}

              {/* CSV Import Button */}
              <button
                onClick={() => setShowImportDialog(true)}
                className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50 h-8"
                title="Import from CSV"
              >
                <Upload size={16} className="text-muted-foreground" />
              </button>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50 h-8">
                  <Filter size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Industry</DropdownMenuLabel>
                {uniqueIndustries.map(industry => (
                  <DropdownMenuCheckboxItem 
                    key={industry}
                    checked={activeFilters.industries.includes(industry)}
                    onCheckedChange={(checked) => handleFilterChange('industries', industry, !!checked)}
                  >
                    <div className="flex items-center gap-2">
                      <Building size={12} />
                      {industry}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllFilters} className="text-red-600 hover:text-red-700">
                  Clear All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Columns Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                  <Columns size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(showColumns).map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setShowColumns(prev => ({ ...prev, [key]: !!checked }))
                    }
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50 h-8">
                  <Settings size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-50">
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort('lastActivity')}>
                  Sort by Last Activity {sortBy === 'lastActivity' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('company')}>
                  Sort by Company {sortBy === 'company' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('totalRequests')}>
                  Sort by Total Requests {sortBy === 'totalRequests' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedClientIds.length === filteredClients.length && filteredClients.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {showColumns.client && (
                <TableHead className="min-w-[200px]">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Client
                    <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
              )}
              {showColumns.company && (
                <TableHead>
                  <button
                    onClick={() => handleSort('company')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Company
                    <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
              )}
              {showColumns.industry && <TableHead>Industry</TableHead>}
              {showColumns.status && <TableHead>Status</TableHead>}
              {showColumns.requests && (
                <TableHead>
                  <button
                    onClick={() => handleSort('totalRequests')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Requests
                    <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
              )}
              {showColumns.lastActivity && (
                <TableHead>
                  <button
                    onClick={() => handleSort('lastActivity')}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Last Activity
                    <ArrowUpDown size={12} className="text-muted-foreground" />
                  </button>
                </TableHead>
              )}
              {showColumns.actions && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClients.map((client) => (
              <TableRow 
                key={client.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleClientClick(client)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedClientIds.includes(client.id)}
                    onCheckedChange={() => handleSelectClient(client.id)}
                  />
                </TableCell>
                {showColumns.client && (
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={client.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                    </div>
                  </TableCell>
                )}
                {showColumns.company && (
                  <TableCell className="font-medium">{client.company}</TableCell>
                )}
                {showColumns.industry && (
                  <TableCell className="text-muted-foreground">{client.industry}</TableCell>
                )}
                {showColumns.status && (
                  <TableCell>
                    <Badge variant={getStatusVariant(client.status)}>
                      {client.status}
                    </Badge>
                  </TableCell>
                )}
                {showColumns.requests && (
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{client.total_requests}</span>
                      <span className="text-muted-foreground"> total</span>
                      {client.active_requests > 0 && (
                        <span className="ml-2 text-xs text-orange-600">
                          {client.active_requests} active
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {showColumns.lastActivity && (
                  <TableCell className="text-muted-foreground">
                    {formatDate(client.last_activity)}
                  </TableCell>
                )}
                {showColumns.actions && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Settings size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleClientClick(client)}>
                          <Eye size={16} className="mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit size={16} className="mr-2" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash size={16} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {sortedClients.length === 0 && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              👥
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No clients found</h3>
            <p className="text-muted-foreground max-w-sm">
              {activeFilters.industries.length > 0 || activeFilters.statuses.length > 0
                ? "Try adjusting your filters."
                : "Your clients will appear here once you start creating onboarding links."
              }
            </p>
          </div>
        </div>
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Selected Clients"
        description={`Are you sure you want to delete ${selectedClientIds.length} client(s)? This action cannot be undone.`}
        confirmationText="DELETE"
        onConfirm={() => {}}
        isDeleting={false}
      />

      <CSVImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={refetch}
      />
    </div>
  );
};