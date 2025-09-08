import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REQUEST_STATUSES } from "@/lib/constants";
import { getStatusColor } from "@/lib/status-helpers";
import { ChevronDown } from "@untitledui/icons";

interface StatusDropdownProps {
  status: 'to_do' | 'in_progress' | 'on_hold' | 'completed';
  onStatusChange: (status: 'to_do' | 'in_progress' | 'on_hold' | 'completed') => void;
  variant?: 'badge' | 'kanban';
}

export const StatusDropdown = ({ status, onStatusChange, variant = 'badge' }: StatusDropdownProps) => {
  const statusOptions = Object.entries(REQUEST_STATUSES) as [keyof typeof REQUEST_STATUSES, string][];

  if (variant === 'kanban') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
            getStatusColor(REQUEST_STATUSES[status], 'request')
          }`}>
            {REQUEST_STATUSES[status]}
            <ChevronDown size={12} className="ml-1" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 bg-background border border-border shadow-md">
          {statusOptions.map(([key, label]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onStatusChange(key)}
              className={`${key === status ? 'bg-accent' : ''} hover:bg-accent/50`}
            >
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mr-2 ${
                getStatusColor(label, 'request')
              }`}>
                {label}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge 
          variant="outline" 
          className={`cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(REQUEST_STATUSES[status], 'request')}`}
        >
          {REQUEST_STATUSES[status]}
          <ChevronDown size={12} className="ml-1" />
        </Badge>
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
              className={`mr-2 ${getStatusColor(label, 'request')}`}
            >
              {label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};