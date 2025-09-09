import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Request } from "@/hooks/useRequests";
import { REQUEST_PRIORITIES } from "@/lib/constants";
import { Calendar, User01 as User, Mail01 as Mail, Globe01 as Globe, Building01 as Building } from "@untitledui/icons";

interface ViewRequestDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewRequestDialog = ({ request, open, onOpenChange }: ViewRequestDialogProps) => {
  if (!request) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{request.title}</DialogTitle>
          <DialogDescription className="sr-only">
            View request details
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex gap-3">
            <Badge 
              variant="outline" 
              className={`text-sm capitalize ${getStatusColor(request.status)}`}
            >
              {request.status.replace('_', ' ')}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-sm capitalize ${getPriorityColor(request.priority)}`}
            >
              {REQUEST_PRIORITIES[request.priority as keyof typeof REQUEST_PRIORITIES]}
            </Badge>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{request.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Client Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-muted-foreground" />
                  <span>{request.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-muted-foreground" />
                  <span>{request.client_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building size={16} className="text-muted-foreground" />
                  <span>{request.company_name}</span>
                </div>
                {request.website_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe size={16} className="text-muted-foreground" />
                    <span>{request.website_name || request.website_url}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Request Details</h3>
              <div className="space-y-3">
                {request.assigned_to_name ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Assigned To</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={request.assigned_to_avatar || undefined} alt={request.assigned_to_name} />
                        <AvatarFallback className="text-xs">
                          {request.assigned_to_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{request.assigned_to_name}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not assigned</p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={16} />
                  <span>Created {new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                
                {request.due_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={16} />
                    <span>Due {new Date(request.due_date).toLocaleDateString()}</span>
                  </div>
                )}
                
                {request.completed_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={16} />
                    <span>Completed {new Date(request.completed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};