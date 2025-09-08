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
  SearchSm as Search
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
    { key: 'all', label: 'All', count: mockRequests.length },
    { key: 'todo', label: 'To Do', count: mockRequests.filter(r => r.status === 'todo').length },
    { key: 'in_progress', label: 'In Progress', count: mockRequests.filter(r => r.status === 'in_progress').length },
    { key: 'on_hold', label: 'On Hold', count: mockRequests.filter(r => r.status === 'on_hold').length },
    { key: 'completed', label: 'Completed', count: mockRequests.filter(r => r.status === 'completed').length },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'todo': return 'secondary';
      case 'in_progress': return 'default';
      case 'on_hold': return 'outline';
      case 'completed': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white border-red-500';
      case 'high':
        return 'bg-orange-500 text-white border-orange-500';
      case 'medium':
        return 'bg-yellow-500 text-black border-yellow-500';
      case 'low':
        return 'bg-blue-500 text-white border-blue-500';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatPriority = (priority: string) => {
    return REQUEST_PRIORITIES[priority as keyof typeof REQUEST_PRIORITIES] || priority;
  };

  const filteredRequests = activeStatus === 'all' 
    ? mockRequests 
    : mockRequests.filter(request => request.status === activeStatus);

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
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(request.priority)}
                    >
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
          No requests found matching your criteria.
        </div>
      )}
    </div>
  );
};