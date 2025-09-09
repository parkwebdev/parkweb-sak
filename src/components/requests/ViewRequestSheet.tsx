import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Request } from "@/hooks/useRequests";
import { REQUEST_PRIORITIES } from "@/lib/constants";
import { Calendar, User01 as User, Mail01 as Mail, Globe01 as Globe, Building01 as Building } from "@untitledui/icons";

interface ViewRequestSheetProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewRequestSheet = ({ request, open, onOpenChange }: ViewRequestSheetProps) => {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
        <SheetHeader className="space-y-4">
          <div className="space-y-2">
            <SheetTitle className="text-xl">{request.title}</SheetTitle>
            <SheetDescription className="sr-only">
              View request details
            </SheetDescription>
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
          </div>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          <div>
            <h3 className="font-semibold mb-3 text-base">Description</h3>
            <p className="text-muted-foreground leading-relaxed">{request.description}</p>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4 text-base">Client Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                    <User size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{request.client_name}</p>
                    <p className="text-sm text-muted-foreground">Client Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                    <Mail size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{request.client_email}</p>
                    <p className="text-sm text-muted-foreground">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                    <Building size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{request.company_name}</p>
                    <p className="text-sm text-muted-foreground">Company</p>
                  </div>
                </div>
                {request.website_url && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                      <Globe size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{request.website_name || request.website_url}</p>
                      <p className="text-sm text-muted-foreground">Website</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-base">Request Details</h3>
              <div className="space-y-4">
                {request.assigned_to_name ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={request.assigned_to_avatar || undefined} alt={request.assigned_to_name} />
                      <AvatarFallback className="text-xs">
                        {request.assigned_to_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.assigned_to_name}</p>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                      <User size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Not assigned</p>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                    <Calendar size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">Created</p>
                  </div>
                </div>
                
                {request.due_date && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                      <Calendar size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{new Date(request.due_date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                    </div>
                  </div>
                )}
                
                {request.completed_at && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                      <Calendar size={16} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{new Date(request.completed_at).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};