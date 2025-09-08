import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { REQUEST_PRIORITIES } from "@/lib/constants";
import { ChevronDown } from "@untitledui/icons";

interface PriorityDropdownProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  onPriorityChange: (priority: 'low' | 'medium' | 'high' | 'urgent') => void;
}

export const PriorityDropdown = ({ priority, onPriorityChange }: PriorityDropdownProps) => {
  const priorityOptions = Object.entries(REQUEST_PRIORITIES) as [keyof typeof REQUEST_PRIORITIES, string][];

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:opacity-80 ${getPriorityColor(priority)}`}
        >
          {REQUEST_PRIORITIES[priority]}
          <ChevronDown size={12} className="ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 bg-background border border-border shadow-md">
        {priorityOptions.map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onPriorityChange(key)}
            className={`${key === priority ? 'bg-accent' : ''} hover:bg-accent/50`}
          >
            <Badge 
              variant="outline" 
              className={`mr-2 ${getPriorityColor(key)}`}
            >
              {label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};