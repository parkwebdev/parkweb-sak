import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Request } from "@/hooks/useRequests";
import { REQUEST_PRIORITIES } from "@/lib/constants";
import { Calendar, User01 as User, Mail01 as Mail, Globe01 as Globe, Building01 as Building } from "@untitledui/icons";
import { useFieldAutoSave } from "@/hooks/useFieldAutoSave";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RequestDetailsSheetProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export const RequestDetailsSheet = ({ request, open, onOpenChange, onUpdate }: RequestDetailsSheetProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Request['status']>('to_do');
  const [priority, setPriority] = useState<Request['priority']>('medium');
  const { toast } = useToast();

  // Update form fields when request changes
  useEffect(() => {
    if (request) {
      setTitle(request.title);
      setDescription(request.description);
      setStatus(request.status);
      setPriority(request.priority);
    }
  }, [request]);

  const saveRequest = async (data: Partial<Request>) => {
    if (!request) return;

    const { error } = await supabase
      .from('requests')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (error) throw error;
    onUpdate?.();
  };

  const { 
    updateField: updateTitle,
    isSaving: isSavingTitle 
  } = useFieldAutoSave({
    initialValue: title,
    onSave: (value) => saveRequest({ title: value }),
    delay: 1000
  });

  const { 
    updateField: updateDescription,
    isSaving: isSavingDescription 
  } = useFieldAutoSave({
    initialValue: description,
    onSave: (value) => saveRequest({ description: value }),
    delay: 1000
  });

  const handleStatusChange = async (newStatus: Request['status']) => {
    setStatus(newStatus);
    try {
      await saveRequest({ 
        status: newStatus,
        ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : { completed_at: null })
      });
      toast({
        title: "Status Updated",
        description: `Request status changed to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handlePriorityChange = async (newPriority: Request['priority']) => {
    setPriority(newPriority);
    try {
      await saveRequest({ priority: newPriority });
      toast({
        title: "Priority Updated", 
        description: `Request priority changed to ${newPriority}`,
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to_do':
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800';
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'on_hold':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (!request) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[700px] sm:max-w-[700px] overflow-y-auto bg-background">
        <SheetHeader className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Request Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  updateTitle(e.target.value);
                }}
                placeholder="Enter request title"
                className="text-xl font-semibold border-none px-0 shadow-none focus-visible:ring-0"
                disabled={isSavingTitle}
              />
            </div>
            <SheetDescription className="sr-only">
              Request details and editing
            </SheetDescription>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`text-sm capitalize cursor-pointer hover:bg-accent/50 ${getStatusColor(status)}`}
                  >
                    {status.replace('_', ' ')}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50">
                  <DropdownMenuItem onClick={() => handleStatusChange('to_do')}>
                    To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                    On Hold
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`text-sm capitalize cursor-pointer hover:bg-accent/50 ${getPriorityColor(priority)}`}
                  >
                    {REQUEST_PRIORITIES[priority as keyof typeof REQUEST_PRIORITIES]}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-50">
                  <DropdownMenuItem onClick={() => handlePriorityChange('low')}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Low
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePriorityChange('medium')}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      Medium
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePriorityChange('high')}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      High
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePriorityChange('urgent')}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Urgent
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                updateDescription(e.target.value);
              }}
              placeholder="Enter request description"
              rows={4}
              className="resize-none"
              disabled={isSavingDescription}
            />
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-base">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                  <User size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{request.client_name}</p>
                  <p className="text-sm text-muted-foreground">Client Name</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                  <Mail size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{request.client_email}</p>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                  <Building size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{request.company_name}</p>
                  <p className="text-sm text-muted-foreground">Company</p>
                </div>
              </div>
              
              {request.website_url ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                    <Globe size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{request.website_name || request.website_url}</p>
                    <p className="text-sm text-muted-foreground">Website</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                    <Globe size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-muted-foreground">No website</p>
                    <p className="text-sm text-muted-foreground">Website</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-base">Request Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {request.assigned_to_name ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={request.assigned_to_avatar || undefined} alt={request.assigned_to_name} />
                    <AvatarFallback className="text-xs">
                      {request.assigned_to_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{request.assigned_to_name}</p>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-muted-foreground">Not assigned</p>
                    <p className="text-sm text-muted-foreground">Assigned To</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                  <Calendar size={16} className="text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Created</p>
                </div>
              </div>
              
              {request.due_date ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                    <Calendar size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{new Date(request.due_date).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 opacity-50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                    <Calendar size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-muted-foreground">No due date</p>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                  </div>
                </div>
              )}
              
              {request.completed_at && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background">
                    <Calendar size={16} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{new Date(request.completed_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};