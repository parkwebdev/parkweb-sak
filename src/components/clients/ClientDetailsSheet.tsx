import React from 'react';
import { X, Mail01 as Mail, Building01 as Building, Globe01 as Globe, Calendar, File02 as FileText, Mail01 as MessageSquare, LinkExternal01 as ExternalLink } from '@untitledui/icons';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow, format } from 'date-fns';
import type { Client } from '@/hooks/useClients';

interface ClientDetailsSheetProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export const ClientDetailsSheet: React.FC<ClientDetailsSheetProps> = ({
  client,
  open,
  onOpenChange,
  onClose
}) => {
  if (!client) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'secondary';
      case 'onboarding':
        return 'outline';
      case 'active':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">Client Details</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Client Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={client.avatar_url} alt={client.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-foreground">{client.name}</h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Building size={14} />
                {client.company}
              </p>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <Mail size={14} />
                {client.email}
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Badge variant={getStatusVariant(client.status)}>
                  {client.status}
                </Badge>
                <Badge variant="outline">
                  {client.industry}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{client.total_requests}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <MessageSquare size={12} />
                Total Requests
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{client.scope_of_works}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <FileText size={12} />
                Scope of Works
              </div>
            </div>
          </div>

          {/* Request Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Request Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Requests</span>
                <Badge variant="outline">{client.active_requests}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed Requests</span>
                <Badge variant="secondary">{client.completed_requests}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={12} />
                  Client Since
                </span>
                <span className="text-sm font-medium">
                  {format(new Date(client.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar size={12} />
                  Last Activity
                </span>
                <span className="text-sm font-medium">
                  {formatDistanceToNow(new Date(client.last_activity), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Onboarding Info */}
          {client.onboarding_status && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Onboarding</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline">{client.onboarding_status}</Badge>
                  </div>
                  {client.onboarding_url && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Onboarding Link</span>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={client.onboarding_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={12} className="mr-1" />
                          View
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Personal Note */}
          {client.personal_note && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Notes</h3>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{client.personal_note}</p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-4">
            <Button className="w-full" size="sm">
              Create New Request
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              Send Onboarding Link
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};