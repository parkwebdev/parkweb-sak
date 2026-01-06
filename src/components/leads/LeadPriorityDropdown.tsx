/**
 * @fileoverview Lead priority dropdown with color-coded badges.
 * Displays priority status and allows changing via dropdown menu.
 */

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Flag01 } from '@untitledui/icons';
import { PRIORITY_CONFIG, PRIORITY_OPTIONS, normalizePriority, type PriorityValue } from '@/lib/priority-config';
import { useCanManage } from '@/hooks/useCanManage';

interface LeadPriorityDropdownProps {
  priority: string | null | undefined;
  onPriorityChange: (priority: string) => void;
}

export function LeadPriorityDropdown({ priority, onPriorityChange }: LeadPriorityDropdownProps) {
  const canManageLeads = useCanManage('manage_leads');
  const normalizedPriority = normalizePriority(priority);
  const config = PRIORITY_CONFIG[normalizedPriority];

  // Read-only mode: just show the badge without dropdown
  if (!canManageLeads) {
    return (
      <Badge 
        variant="outline" 
        className={config.badgeClass}
      >
        <Flag01 size={10} className="mr-1" />
        {config.label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1">
          <Badge 
            variant="outline" 
            className={config.badgeClass}
          >
            <Flag01 size={10} className="mr-1" />
            {config.label}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-background z-50">
        {PRIORITY_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onPriorityChange(option.value)}
          >
            <Badge 
              variant="outline"
              className={PRIORITY_CONFIG[option.value as PriorityValue].badgeClass}
            >
              <Flag01 size={10} className="mr-1" />
              {option.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
