import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  Edit01 as Edit, 
  Trash01 as Trash, 
  Settings01 as Settings,
  ChevronDown,
  ArrowsDown as ArrowUpDown,
  DotsGrid as Columns,
  FilterLines as Filter,
  SearchLg as Search
} from "@untitledui/icons";
import { REQUEST_STATUSES, REQUEST_PRIORITIES } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

// Mock data for now
const mockRequests = [
  {
    id: "1",
    title: "Update homepage banner",
    description: "Change the main banner image and text",
    status: "todo" as const,
    priority: "high" as const,
    client_name: "Acme Corp",
    website: "acmecorp.com",
    created_at: "2024-01-15",
    assigned_to: null
  },
  {
    id: "2", 
    title: "Fix contact form",
    description: "Contact form not sending emails properly",
    status: "in_progress" as const,
    priority: "urgent" as const,
    client_name: "Tech Solutions",
    website: "techsolutions.com",
    created_at: "2024-01-14",
    assigned_to: "John Doe"
  },
  {
    id: "3",
    title: "Add new product page",
    description: "Create a dedicated page for the new product line",
    status: "on_hold" as const,
    priority: "medium" as const,
    client_name: "StartupXYZ",
    website: "startupxyz.com",
    created_at: "2024-01-13",
    assigned_to: "Jane Smith"
  },
  {
    id: "4",
    title: "Update company logo",
    description: "Replace old logo across all pages",
    status: "completed" as const,
    priority: "low" as const,
    client_name: "Global Inc",
    website: "globalinc.com",
    created_at: "2024-01-12",
    assigned_to: "Mike Johnson"
  }
];

export const RequestsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'in_progress': return 'default';
      case 'on_hold': return 'outline';
      case 'completed': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'outline';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatPriority = (priority: string) => {
    return REQUEST_PRIORITIES[priority as keyof typeof REQUEST_PRIORITIES] || priority;
  };

  const filteredRequests = mockRequests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 p-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>All Statuses</DropdownMenuItem>
              <DropdownMenuItem>To Do</DropdownMenuItem>
              <DropdownMenuItem>In Progress</DropdownMenuItem>
              <DropdownMenuItem>On Hold</DropdownMenuItem>
              <DropdownMenuItem>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
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

          {/* Settings */}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
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
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                    </div>
                  </TableCell>
                )}
                {showColumns.client && (
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.client_name}</p>
                      <p className="text-sm text-muted-foreground">{request.website}</p>
                    </div>
                  </TableCell>
                )}
                {showColumns.status && (
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {REQUEST_STATUSES[request.status]}
                    </Badge>
                  </TableCell>
                )}
                {showColumns.priority && (
                  <TableCell>
                    <Badge variant={getPriorityBadgeVariant(request.priority)}>
                      {formatPriority(request.priority)}
                    </Badge>
                  </TableCell>
                )}
                {showColumns.assigned && (
                  <TableCell>
                    {request.assigned_to || <span className="text-muted-foreground">Unassigned</span>}
                  </TableCell>
                )}
                {showColumns.created && (
                  <TableCell className="text-sm">{request.created_at}</TableCell>
                )}
                {showColumns.actions && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
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
          No requests found matching your search criteria.
        </div>
      )}
    </div>
  );
};