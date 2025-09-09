import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { REQUEST_PRIORITIES } from "@/lib/constants";
import { Calendar, User01 as User } from "@untitledui/icons";
import { useRequests, Request } from "@/hooks/useRequests";
import { RequestDetailsSheet } from "./RequestDetailsSheet";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
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
  onRequestClick: (request: Request) => void;
  selectedRequestIds: string[];
  onSelectRequest: (id: string) => void;
}

const SortableCard = ({ request, onStatusChange, onRequestClick, selectedRequestIds, onSelectRequest }: SortableCardProps) => {
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
    <div className="relative">
      <div 
        className="absolute top-2 left-2 z-10" 
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selectedRequestIds.includes(request.id)}
          onCheckedChange={() => onSelectRequest(request.id)}
          className="bg-background border-2"
        />
      </div>
      
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="hover:shadow-md transition-all duration-200 cursor-pointer bg-card/90 border-border/50 ml-6"
        onClick={() => onRequestClick(request)}
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
              {request.assigned_to_name ? (
                <>
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={request.assigned_to_avatar || undefined} alt={request.assigned_to_name} />
                    <AvatarFallback className="text-xs">
                      {request.assigned_to_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{request.assigned_to_name}</span>
                </>
              ) : (
                <>
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
                  </Avatar>
                  <span>Unassigned</span>
                </>
              )}
            </div>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
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
  onRequestClick: (request: Request) => void;
  selectedRequestIds: string[];
  onSelectRequest: (id: string) => void;
  onSelectAllInColumn: (columnKey: string) => void;
}

const DroppableColumn = ({ column, requests, onStatusChange, onRequestClick, selectedRequestIds, onSelectRequest, onSelectAllInColumn }: DroppableColumnProps) => {
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
        <Checkbox
          checked={requests.length > 0 && requests.every(r => selectedRequestIds.includes(r.id))}
          onCheckedChange={() => onSelectAllInColumn(column.key)}
          className="ml-1"
        />
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
              onRequestClick={onRequestClick}
              selectedRequestIds={selectedRequestIds}
              onSelectRequest={onSelectRequest}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

interface RequestKanbanViewProps {
  openRequestId?: string | null;
}

export const RequestKanbanView = ({ openRequestId }: RequestKanbanViewProps) => {
  const { requests, loading, updateRequestStatus, deleteRequest, refetch } = useRequests();
  const [activeRequest, setActiveRequest] = useState<Request | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
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
    
    const activeRequest = requests.find(request => request.id === activeId);
    if (!activeRequest) return;
    
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

    const activeRequest = requests.find(request => request.id === activeId);
    if (!activeRequest) {
      setActiveRequest(null);
      return;
    }

    const targetColumn = columns.find(col => col.key === overId);
    if (targetColumn && activeRequest.status !== targetColumn.key) {
      updateRequestStatus(activeId, targetColumn.key);
    }

    setActiveRequest(null);
  };

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

  const handleSelectRequest = (id: string) => {
    setSelectedRequestIds(prev => 
      prev.includes(id) 
        ? prev.filter(requestId => requestId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAllInColumn = (columnKey: string) => {
    const columnRequests = getRequestsByStatus(columnKey);
    const columnRequestIds = columnRequests.map(r => r.id);
    const allSelected = columnRequestIds.every(id => selectedRequestIds.includes(id));
    
    if (allSelected) {
      setSelectedRequestIds(prev => prev.filter(id => !columnRequestIds.includes(id)));
    } else {
      setSelectedRequestIds(prev => [...new Set([...prev, ...columnRequestIds])]);
    }
  };

  // Handle auto-opening a request from URL parameter
  useEffect(() => {
    if (openRequestId && requests.length > 0) {
      const requestToOpen = requests.find(r => r.id === openRequestId);
      if (requestToOpen) {
        setSelectedRequest(requestToOpen);
        setDetailsSheetOpen(true);
      }
    }
  }, [openRequestId, requests]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading requests...</div>;
  }

  return (
    <div className="min-h-screen">
      {/* Bulk Actions Bar */}
      {selectedRequestIds.length > 0 && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedRequestIds.length} request(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="h-8 px-3 text-sm"
          >
            Delete Selected
          </Button>
        </div>
      )}

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
              onRequestClick={handleRequestClick}
              selectedRequestIds={selectedRequestIds}
              onSelectRequest={handleSelectRequest}
              onSelectAllInColumn={handleSelectAllInColumn}
            />
          ))}
        </div>

        <DragOverlay>
          {activeRequest ? (
            <SortableCard 
              request={activeRequest} 
              onStatusChange={updateRequestStatus}
              onRequestClick={handleRequestClick}
              selectedRequestIds={selectedRequestIds}
              onSelectRequest={handleSelectRequest}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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