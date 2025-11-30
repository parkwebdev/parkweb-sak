import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';

interface LeadsTableProps {
  leads: Tables<'leads'>[];
  onView: (lead: Tables<'leads'>) => void;
  onStatusChange: (leadId: string, status: string) => void;
}

export const LeadsTable = ({ leads, onView, onStatusChange }: LeadsTableProps) => {
  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    contacted: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    qualified: 'bg-green-500/10 text-green-500 border-green-500/20',
    converted: 'bg-success/10 text-success border-success/20',
    lost: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead, index) => (
              <AnimatedTableRow key={lead.id} index={index}>
                <TableCell className="font-medium">{lead.name || '-'}</TableCell>
                <TableCell>{lead.email || '-'}</TableCell>
                <TableCell>{lead.phone || '-'}</TableCell>
                <TableCell>{lead.company || '-'}</TableCell>
                <TableCell>
                  <LeadStatusDropdown
                    status={lead.status}
                    onStatusChange={(status) => onStatusChange(lead.id, status)}
                  />
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(lead)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </AnimatedTableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
