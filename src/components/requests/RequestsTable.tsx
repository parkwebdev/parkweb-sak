import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Edit01 as Edit, Trash01 as Trash } from "@untitledui/icons";
import { REQUEST_STATUSES } from "@/lib/constants";

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
  }
];

export const RequestsTable = () => {
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

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{request.title}</p>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{request.client_name}</p>
                  <p className="text-sm text-muted-foreground">{request.website}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {REQUEST_STATUSES[request.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityBadgeVariant(request.priority)}>
                  {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {request.assigned_to || <span className="text-muted-foreground">Unassigned</span>}
              </TableCell>
              <TableCell>{request.created_at}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};