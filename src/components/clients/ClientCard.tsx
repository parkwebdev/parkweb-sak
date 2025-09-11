import React from 'react';
import { Calendar, Building01 as Building, Globe01 as Globe, File02 as FileText, Mail01 as MessageSquare } from '@untitledui/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { Client } from '@/hooks/useClients';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
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
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/20"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={client.avatar_url} alt={client.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building size={12} />
              {client.company}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStatusVariant(client.status)}>
                {client.status}
              </Badge>
              <Badge variant="outline">
                {client.industry}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <MessageSquare size={12} />
              Total Requests
            </span>
            <span className="font-medium text-foreground">{client.total_requests}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText size={12} />
              Scope of Works
            </span>
            <span className="font-medium text-foreground">{client.scope_of_works}</span>
          </div>

          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              Last Activity
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(client.last_activity), { addSuffix: true })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};