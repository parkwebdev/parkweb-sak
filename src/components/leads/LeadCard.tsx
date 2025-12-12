/**
 * @fileoverview Lead card component for grid view display.
 * Shows lead info with status badge and view button.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail01, Phone, Building02 } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface LeadCardProps {
  lead: Tables<'leads'>;
  onView: (lead: Tables<'leads'>) => void;
}

export const LeadCard = ({ lead, onView }: LeadCardProps) => {
  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    contacted: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    qualified: 'bg-green-500/10 text-green-500 border-green-500/20',
    converted: 'bg-success/10 text-success border-success/20',
    lost: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{lead.name || 'Unknown'}</h3>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </p>
        </div>
        <Badge variant="outline" className={statusColors[lead.status] || statusColors.new}>
          {lead.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {lead.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail01 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.company && (
          <div className="flex items-center gap-2 text-sm">
            <Building02 className="h-4 w-4 text-muted-foreground" />
            <span>{lead.company}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => onView(lead)}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
