import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUEST_STATUSES } from "@/lib/constants";
import { Eye, Edit01 as Edit, Calendar, User01 as User } from "@untitledui/icons";

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

export const RequestKanbanView = () => {
  const columns = [
    { key: 'todo', title: 'To Do', color: 'bg-secondary' },
    { key: 'in_progress', title: 'In Progress', color: 'bg-blue-500' },
    { key: 'on_hold', title: 'On Hold', color: 'bg-yellow-500' },
    { key: 'completed', title: 'Completed', color: 'bg-green-500' }
  ];

  const getRequestsByStatus = (status: string) => {
    return mockRequests.filter(request => request.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-blue-500';
      case 'low': return 'border-l-gray-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => (
        <div key={column.key} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              {getRequestsByStatus(column.key).length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {getRequestsByStatus(column.key).map((request) => (
              <Card key={request.id} className={`border-l-4 ${getPriorityColor(request.priority)} hover:shadow-md transition-shadow cursor-pointer`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{request.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {request.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User size={12} />
                      {request.client_name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      {request.created_at}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {request.priority}
                      </Badge>
                      <div className="flex gap-1">
                        <Eye size={14} className="text-muted-foreground hover:text-foreground cursor-pointer" />
                        <Edit size={14} className="text-muted-foreground hover:text-foreground cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};