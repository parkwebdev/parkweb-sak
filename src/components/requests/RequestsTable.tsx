import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Eye, 
  Edit01 as Edit, 
  Trash01 as Trash, 
  Settings01 as Settings,
  ChevronDown,
  ArrowsDown as ArrowUpDown,
  DotsGrid as Columns,
  FilterLines as Filter,
  SearchSm as Search
} from "@untitledui/icons";
import { REQUEST_STATUSES, REQUEST_PRIORITIES } from "@/lib/constants";
import { useRequests, Request } from "@/hooks/useRequests";
import { StatusDropdown } from "./StatusDropdown";
import { PriorityDropdown } from "./PriorityDropdown";
import { RequestDetailsSheet } from "./RequestDetailsSheet";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
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


export const RequestsTable = () => {
  const { requests, loading, updateRequestStatus, updateRequestPriority, deleteRequest, refetch } = useRequests();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const { toast } = useToast();
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState({
    assignees: [] as string[],
    priorities: [] as string[],
    companies: [] as string[]
  });
  const [showColumns, setShowColumns] = useState({
    request: true,
    client: true,
    status: true,
    priority: true,
    assigned: true,
    created: true,
    actions: true,
  });

  const statusTabs = [
    { key: 'all', label: 'All', count: requests.length },
    { key: 'to_do', label: 'To Do', count: requests.filter(r => r.status === 'to_do').length },
    { key: 'in_progress', label: 'In Progress', count: requests.filter(r => r.status === 'in_progress').length },
    { key: 'on_hold', label: 'On Hold', count: requests.filter(r => r.status === 'on_hold').length },
    { key: 'completed', label: 'Completed', count: requests.filter(r => r.status === 'completed').length },
  ];


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatPriority = (priority: string) => {
    return REQUEST_PRIORITIES[priority as keyof typeof REQUEST_PRIORITIES] || priority;
  };

  // Get unique values for filters
  const uniqueAssignees = Array.from(new Set(requests.map(r => r.assigned_to_name).filter(Boolean)));
  const uniqueCompanies = Array.from(new Set(requests.map(r => r.company_name)));
  
  const filteredRequests = requests.filter(request => {
    // Status filter
    if (activeStatus !== 'all' && request.status !== activeStatus) return false;
    
    // Assignee filter
    if (activeFilters.assignees.length > 0) {
      const isUnassignedSelected = activeFilters.assignees.includes('unassigned');
      const isAssigned = request.assigned_to_name !== null;
      
      if (isUnassignedSelected && !isAssigned) return true;
      if (!isUnassignedSelected && !isAssigned) return false;
      if (isAssigned && !activeFilters.assignees.includes(request.assigned_to_name!)) return false;
    }
    
    // Priority filter
    if (activeFilters.priorities.length > 0 && !activeFilters.priorities.includes(request.priority)) return false;
    
    // Company filter  
    if (activeFilters.companies.length > 0 && !activeFilters.companies.includes(request.company_name)) return false;
    
    return true;
  });

  // Apply sorting
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortBy) return 0;
    
    let aVal: any, bVal: any;
    switch (sortBy) {
      case 'created':
        aVal = new Date(a.created_at);
        bVal = new Date(b.created_at);
        break;
      case 'priority':
        const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
        aVal = priorityOrder[a.priority as keyof typeof priorityOrder];
        bVal = priorityOrder[b.priority as keyof typeof priorityOrder];
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'client':
        aVal = a.client_name.toLowerCase();
        bVal = b.client_name.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleRequestClick = (request: Request) => {
    setSelectedRequest(request);
    setDetailsSheetOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedRequestIds.length === 0) return;
    setDeleteDialogOpen(true);
    setDeleteConfirmation("");
  };

  const confirmBulkDelete = async () => {
    setIsDeleting(true);
    
    try {
      for (const id of selectedRequestIds) {
        await deleteRequest(id);
      }
      setSelectedRequestIds([]);
      toast({
        title: "Requests Deleted",
        description: `${selectedRequestIds.length} request(s) have been deleted`,
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to delete some requests",
        variant: "destructive",
      });
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
  };

  const handleSelectAll = () => {
    if (selectedRequestIds.length === filteredRequests.length) {
      setSelectedRequestIds([]);
    } else {
      setSelectedRequestIds(filteredRequests.map(r => r.id));
    }
  };

  const handleSelectRequest = (id: string) => {
    setSelectedRequestIds(prev => 
      prev.includes(id) 
        ? prev.filter(requestId => requestId !== id)
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
      assignees: [],
      priorities: [],
      companies: []
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

  if (loading) {
    return <div className="flex items-center justify-center p-8 text-muted-foreground">Loading requests...</div>;
  }

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header with Filters and Controls */}
      <header className="w-full border-b border-border">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 px-4 py-3">
      {/* Filter buttons - scrollable on mobile */}
            <div className="overflow-x-auto">
              <div className="border shadow-sm flex overflow-hidden text-xs text-foreground font-medium leading-none rounded-md border-border min-w-max">
                {statusTabs.map((tab, index) => {
                  const tabCount = tab.key === 'all' ? sortedRequests.length : sortedRequests.filter(r => r.status === tab.key).length;
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
            {selectedRequestIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-destructive font-medium leading-none bg-background px-2 py-1.5 rounded-md border-destructive hover:bg-destructive/10 h-8 mr-2"
              >
                <Trash size={14} />
                Delete ({selectedRequestIds.length})
              </button>
            )}

            {/* Filter Dropdown - Icon Only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50 h-8">
                  <Filter size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Assignees</DropdownMenuLabel>
                <DropdownMenuCheckboxItem 
                  checked={activeFilters.assignees.includes('unassigned')}
                  onCheckedChange={(checked) => handleFilterChange('assignees', 'unassigned', !!checked)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
                    </Avatar>
                    Unassigned
                  </div>
                </DropdownMenuCheckboxItem>
                {uniqueAssignees.map(assignee => (
                  <DropdownMenuCheckboxItem 
                    key={assignee}
                    checked={activeFilters.assignees.includes(assignee)}
                    onCheckedChange={(checked) => handleFilterChange('assignees', assignee, !!checked)}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={requests.find(r => r.assigned_to_name === assignee)?.assigned_to_avatar} />
                        <AvatarFallback className="text-xs">
                          {assignee.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {assignee}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Priority</DropdownMenuLabel>
                {(['urgent', 'high', 'medium', 'low'] as const).map(priority => (
                  <DropdownMenuCheckboxItem 
                    key={priority}
                    checked={activeFilters.priorities.includes(priority)}
                    onCheckedChange={(checked) => handleFilterChange('priorities', priority, !!checked)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        priority === 'urgent' ? 'bg-red-500' : 
                        priority === 'high' ? 'bg-orange-500' : 
                        priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      {REQUEST_PRIORITIES[priority]}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllFilters} className="text-red-600 hover:text-red-700">
                  Clear All Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Columns Dropdown - Icon Only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                  <Columns size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showColumns.request}
                  onCheckedChange={(checked) =>
                    setShowColumns(prev => ({ ...prev, request: !!checked }))
                  }
                >
                  Request
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showColumns.client}
                  onCheckedChange={(checked) =>
                    setShowColumns(prev => ({ ...prev, client: !!checked }))
                  }
                >
                  Client
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showColumns.status}
                  onCheckedChange={(checked) =>
                    setShowColumns(prev => ({ ...prev, status: !!checked }))
                  }
                >
                  Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showColumns.priority}
                  onCheckedChange={(checked) =>
                    setShowColumns(prev => ({ ...prev, priority: !!checked }))
                  }
                >
                  Priority
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings - Icon Only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50 h-8">
                  <Settings size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 z-50">
                <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort('created')}>
                  Sort by Created Date {sortBy === 'created' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('priority')}>
                  Sort by Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('status')}>
                  Sort by Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('client')}>
                  Sort by Client Name {sortBy === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllFilters} className="text-red-600 hover:text-red-700">
                  Reset to Default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRequestIds.length === sortedRequests.length && sortedRequests.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              {showColumns.request && <TableHead>Request</TableHead>}
              {showColumns.client && <TableHead>Client</TableHead>}
              {showColumns.status && <TableHead>Status</TableHead>}
              {showColumns.priority && <TableHead>Priority</TableHead>}
              {showColumns.assigned && <TableHead>Assigned To</TableHead>}
              {showColumns.created && <TableHead>Created</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.map((request) => (
              <TableRow 
                key={request.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRequestClick(request)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRequestIds.includes(request.id)}
                    onCheckedChange={() => handleSelectRequest(request.id)}
                  />
                </TableCell>
                {showColumns.request && (
                  <TableCell className="max-w-[300px]">
                    <div>
                      <p className="font-medium truncate">{request.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{request.description}</p>
                    </div>
                  </TableCell>
                )}
                {showColumns.client && (
                  <TableCell className="max-w-[200px]">
                    <div>
                      <p className="font-medium truncate">{request.client_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{request.website_name || request.website_url}</p>
                    </div>
                  </TableCell>
                )}
                {showColumns.status && (
                  <TableCell>
                    <StatusDropdown 
                      status={request.status}
                      onStatusChange={(status) => updateRequestStatus(request.id, status)}
                    />
                  </TableCell>
                )}
                {showColumns.priority && (
                  <TableCell>
                    <PriorityDropdown 
                      priority={request.priority}
                      onPriorityChange={(priority) => updateRequestPriority(request.id, priority)}
                    />
                  </TableCell>
                )}
                {showColumns.assigned && (
                  <TableCell className="max-w-[150px]">
                    {request.assigned_to_name ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={request.assigned_to_avatar || undefined} alt={request.assigned_to_name} />
                          <AvatarFallback className="text-xs">
                            {request.assigned_to_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{request.assigned_to_name}</span>
                      </div>
                     ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">Unassigned</span>
                      </div>
                     )}
                  </TableCell>
                )}
                {showColumns.created && (
                  <TableCell className="text-sm">{new Date(request.created_at).toLocaleDateString()}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {sortedRequests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No requests found matching your criteria.
        </div>
      )}

      <RequestDetailsSheet
        request={selectedRequest}
        open={detailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        onUpdate={refetch}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Requests"
        description={`Are you sure you want to delete ${selectedRequestIds.length} request(s)? This action cannot be undone.`}
        confirmationText="delete"
        confirmationValue={deleteConfirmation}
        onConfirmationValueChange={setDeleteConfirmation}
        onConfirm={confirmBulkDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};