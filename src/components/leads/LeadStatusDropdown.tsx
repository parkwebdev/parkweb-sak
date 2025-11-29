import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from '@untitledui/icons';

interface LeadStatusDropdownProps {
  status: string;
  onStatusChange: (status: string) => void;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'converted', label: 'Converted', color: 'bg-success/10 text-success border-success/20' },
  { value: 'lost', label: 'Lost', color: 'bg-muted text-muted-foreground border-border' },
];

export const LeadStatusDropdown = ({ status, onStatusChange }: LeadStatusDropdownProps) => {
  const currentStatus = statusOptions.find((s) => s.value === status) || statusOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1">
          <Badge variant="outline" className={currentStatus.color}>
            {currentStatus.label}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusChange(option.value)}
          >
            <Badge variant="outline" className={option.color}>
              {option.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
