import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ViewRequestSheet } from "./ViewRequestSheet";
import { EditRequestSheet } from "./EditRequestSheet";
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
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
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

  const filteredRequests = activeStatus === 'all' 
    ? requests 
    : requests.filter(request => request.status === activeStatus);

  const handleView = (request: Request) => {
    setSelectedRequest(request);
    setViewSheetOpen(true);
  };

  const handleEdit = (request: Request) => {
    setSelectedRequest(request);
    setEditSheetOpen(true);
  };

  const handleDelete = (request: Request) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
    setDeleteConfirmation("");
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;
    
    setIsDeleting(true);
    await deleteRequest(selectedRequest.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setSelectedRequest(null);
    setDeleteConfirmation("");
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
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Filter Dropdown - Icon Only */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
                  <Filter size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>All Priorities</DropdownMenuItem>
                <DropdownMenuItem>Urgent</DropdownMenuItem>
                <DropdownMenuItem>High</DropdownMenuItem>
                <DropdownMenuItem>Medium</DropdownMenuItem>
                <DropdownMenuItem>Low</DropdownMenuItem>
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
            <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2 py-1.5 rounded-md border-border hover:bg-accent/50">
              <Settings size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {showColumns.request && <TableHead>Request</TableHead>}
              {showColumns.client && <TableHead>Client</TableHead>}
              {showColumns.status && <TableHead>Status</TableHead>}
              {showColumns.priority && <TableHead>Priority</TableHead>}
              {showColumns.assigned && <TableHead>Assigned To</TableHead>}
              {showColumns.created && <TableHead>Created</TableHead>}
              {showColumns.actions && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
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
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                )}
                {showColumns.created && (
                  <TableCell className="text-sm">{new Date(request.created_at).toLocaleDateString()}</TableCell>
                )}
                {showColumns.actions && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleView(request)}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(request)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(request)}>
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {filteredRequests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No requests found matching your criteria.
        </div>
      )}

      <ViewRequestSheet
        request={selectedRequest}
        open={viewSheetOpen}
        onOpenChange={setViewSheetOpen}
      />

      <EditRequestSheet
        request={selectedRequest}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onUpdate={refetch}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Request"
        description={`Are you sure you want to delete "${selectedRequest?.title}"? This action cannot be undone.`}
        confirmationText="delete"
        confirmationValue={deleteConfirmation}
        onConfirmationValueChange={setDeleteConfirmation}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};