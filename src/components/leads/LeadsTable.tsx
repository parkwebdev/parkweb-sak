import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { LeadStatusDropdown } from './LeadStatusDropdown';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';

interface LeadsTableProps {
  leads: Tables<'leads'>[];
  selectedIds: Set<string>;
  onView: (lead: Tables<'leads'>) => void;
  onStatusChange: (leadId: string, status: string) => void;
  onSelectionChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const LeadsTable = ({ 
  leads, 
  selectedIds,
  onView, 
  onStatusChange,
  onSelectionChange,
  onSelectAll,
}: LeadsTableProps) => {
  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < leads.length;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked === true)}
                aria-label="Select all"
                {...(someSelected ? { 'data-state': 'indeterminate' } : {})}
              />
            </TableHead>
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
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No leads found
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead, index) => (
              <AnimatedTableRow key={lead.id} index={index}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onCheckedChange={(checked) => onSelectionChange(lead.id, checked === true)}
                    aria-label={`Select ${lead.name || 'lead'}`}
                  />
                </TableCell>
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
