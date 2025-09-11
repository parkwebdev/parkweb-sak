import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getClientStatusColor } from "@/lib/status-helpers";
import { ChevronDown } from "@untitledui/icons";

interface ClientStatusDropdownProps {
  status: 'active' | 'inactive';
  onStatusChange: (status: 'active' | 'inactive') => void;
}

const CLIENT_STATUSES = {
  active: 'Active',
  inactive: 'Inactive',
} as const;

export const ClientStatusDropdown = ({ status, onStatusChange }: ClientStatusDropdownProps) => {
  const statusOptions = Object.entries(CLIENT_STATUSES) as [keyof typeof CLIENT_STATUSES, string][];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer hover:opacity-80 ${getClientStatusColor(CLIENT_STATUSES[status])}`}
        >
          {CLIENT_STATUSES[status]}
          <ChevronDown size={12} className="ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-background border border-border shadow-md">
        {statusOptions.map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onStatusChange(key)}
            className={`${key === status ? 'bg-accent' : ''} hover:bg-accent/50`}
          >
            <Badge 
              variant="outline" 
              className={`mr-2 ${getClientStatusColor(label)}`}
            >
              {label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};