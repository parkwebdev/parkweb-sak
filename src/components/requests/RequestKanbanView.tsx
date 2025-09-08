import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUEST_STATUSES, REQUEST_PRIORITIES } from "@/lib/constants";
import { Eye, Edit01 as Edit, Calendar, User01 as User } from "@untitledui/icons";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Request {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_name: string;
  website: string;
  created_at: string;
  assigned_to: string | null;
}

// Mock data with all statuses
const initialRequests: Request[] = [
  {
    id: "1",
    title: "Update homepage banner",
    description: "Change the main banner image and text",
    status: "todo",
    priority: "high",
    client_name: "Acme Corp",
    website: "acmecorp.com",
    created_at: "2024-01-15",
    assigned_to: null
  },
  {
    id: "2", 
    title: "Fix contact form",
    description: "Contact form not sending emails properly",
    status: "in_progress",
    priority: "urgent",
    client_name: "Tech Solutions",
    website: "techsolutions.com",
    created_at: "2024-01-14",
    assigned_to: "John Doe"
  },
  {
    id: "3",
    title: "Add new product page",
    description: "Create a dedicated page for the new product line",
    status: "on_hold",
    priority: "medium",
    client_name: "StartupXYZ",
    website: "startupxyz.com",
    created_at: "2024-01-13",
    assigned_to: "Jane Smith"
  },
  {
    id: "4",
    title: "Update company logo",
    description: "Replace old logo across all pages",
    status: "completed",
    priority: "low",
    client_name: "Global Inc",
    website: "globalinc.com",
    created_at: "2024-01-12",
    assigned_to: "Mike Johnson"
  }
];

interface SortableCardProps {
  request: Request;
}

const SortableCard = ({ request }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatPriority = (priority: string) => {
    return REQUEST_PRIORITIES[priority as keyof typeof REQUEST_PRIORITIES] || priority;
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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing bg-card/90 border-border/50"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{request.title}</CardTitle>
        <CardDescription className="text-xs line-clamp-2 text-muted-foreground">
          {request.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User size={12} />
            {request.client_name}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} />
            {request.created_at}
          </div>
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getPriorityColor(request.priority)}`}
            >
              {formatPriority(request.priority)}
            </Badge>
            <div className="flex gap-1">
              <Eye size={14} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              <Edit size={14} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DroppableColumnProps {
  column: {
    key: 'todo' | 'in_progress' | 'on_hold' | 'completed';
    title: string;
    color: string;
  };
  requests: Request[];
}

const DroppableColumn = ({ column, requests }: DroppableColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`space-y-4 min-h-[500px] p-4 rounded-lg bg-muted/50 border border-border/50 transition-all duration-200 ${
        isOver 
          ? 'border-primary bg-primary/5' 
          : 'hover:bg-muted/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${column.color}`} />
        <h3 className="font-medium text-sm">{column.title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.5">
          {requests.length}
        </Badge>
      </div>
      
      <SortableContext 
        items={requests.map(request => request.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {requests.map((request) => (
            <SortableCard key={request.id} request={request} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export const RequestKanbanView = () => {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = [
    { key: 'todo' as const, title: 'To Do', color: 'bg-slate-400' },
    { key: 'in_progress' as const, title: 'In Progress', color: 'bg-blue-500' },
    { key: 'on_hold' as const, title: 'On Hold', color: 'bg-yellow-500' },
    { key: 'completed' as const, title: 'Completed', color: 'bg-green-500' }
  ];

  const getRequestsByStatus = (status: string) => {
    return requests.filter(request => request.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeRequest = requests.find(request => request.id === active.id);
    setActiveRequest(activeRequest || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the active request
    const activeRequest = requests.find(request => request.id === activeId);
    if (!activeRequest) return;
    
    // Check if we're hovering over a column
    const targetColumn = columns.find(col => col.key === overId);
    if (targetColumn && activeRequest.status !== targetColumn.key) {
      setRequests(prev => 
        prev.map(request => 
          request.id === activeId 
            ? { ...request, status: targetColumn.key }
            : request
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveRequest(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active request
    const activeRequest = requests.find(request => request.id === activeId);
    if (!activeRequest) {
      setActiveRequest(null);
      return;
    }

    // Check if we're dropping over a column
    const targetColumn = columns.find(col => col.key === overId);
    if (targetColumn && activeRequest.status !== targetColumn.key) {
      setRequests(prev => 
        prev.map(request => 
          request.id === activeId 
            ? { ...request, status: targetColumn.key }
            : request
        )
      );
    }

    setActiveRequest(null);
  };

  return (
    <div className="min-h-screen">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-0">
          {columns.map((column) => (
            <DroppableColumn
              key={column.key}
              column={column}
              requests={getRequestsByStatus(column.key)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeRequest ? <SortableCard request={activeRequest} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};