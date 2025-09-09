import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { REQUEST_PRIORITIES } from "@/lib/constants";
import { Eye, Edit01 as Edit, Calendar, User01 as User, Trash01 as Trash } from "@untitledui/icons";
import { useRequests, Request } from "@/hooks/useRequests";
import { StatusDropdown } from "./StatusDropdown";
import { ViewRequestDialog } from "./ViewRequestDialog";
import { EditRequestDialog } from "./EditRequestDialog";
import { useToast } from "@/hooks/use-toast";
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

interface SortableCardProps {
  request: Request;
  onStatusChange: (id: string, status: Request['status']) => void;
  onView: (request: Request) => void;
  onEdit: (request: Request) => void;
  onDelete: (request: Request) => void;
}

const SortableCard = ({ request, onStatusChange, onView, onEdit, onDelete }: SortableCardProps) => {
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
          {request.assigned_to_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="h-4 w-4">
                <AvatarImage src={request.assigned_to_avatar || undefined} alt={request.assigned_to_name} />
                <AvatarFallback className="text-xs">
                  {request.assigned_to_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>Assigned: {request.assigned_to_name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar size={12} />
            {new Date(request.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${getPriorityColor(request.priority)}`}
            >
              {formatPriority(request.priority)}
            </Badge>
            <div className="flex gap-1">
              <Eye size={14} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={() => onView(request)} />
              <Edit size={14} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" onClick={() => onEdit(request)} />
              <Trash size={14} className="text-muted-foreground hover:text-red-500 cursor-pointer transition-colors" onClick={() => onDelete(request)} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DroppableColumnProps {
  column: {
    key: 'to_do' | 'in_progress' | 'on_hold' | 'completed';
    title: string;
    color: string;
  };
  requests: Request[];
  onStatusChange: (id: string, status: Request['status']) => void;
  onView: (request: Request) => void;
  onEdit: (request: Request) => void;
  onDelete: (request: Request) => void;
}

const DroppableColumn = ({ column, requests, onStatusChange, onView, onEdit, onDelete }: DroppableColumnProps) => {
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
            <SortableCard 
              key={request.id} 
              request={request} 
              onStatusChange={onStatusChange}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export const RequestKanbanView = () => {
  const { requests, loading, updateRequestStatus, deleteRequest, refetch } = useRequests();
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = [
    { key: 'to_do' as const, title: 'To Do', color: 'bg-blue-500' },
    { key: 'in_progress' as const, title: 'In Progress', color: 'bg-orange-500' },
    { key: 'on_hold' as const, title: 'On Hold', color: 'bg-red-500' },
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
      updateRequestStatus(activeId, targetColumn.key);
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
      updateRequestStatus(activeId, targetColumn.key);
    }

    setActiveRequest(null);
  };

  const handleView = (request: Request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleEdit = (request: Request) => {
    setSelectedRequest(request);
    setEditDialogOpen(true);
  };

  const handleDelete = async (request: Request) => {
    if (window.confirm(`Are you sure you want to delete "${request.title}"?`)) {
      await deleteRequest(request.id);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading requests...</div>;
  }

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
              onStatusChange={updateRequestStatus}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeRequest ? (
            <SortableCard 
              request={activeRequest} 
              onStatusChange={updateRequestStatus}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ViewRequestDialog
        request={selectedRequest}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <EditRequestDialog
        request={selectedRequest}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={refetch}
      />
    </div>
  );
};