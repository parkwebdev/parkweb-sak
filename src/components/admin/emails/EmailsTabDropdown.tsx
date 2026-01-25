/**
 * Emails Tab Dropdown
 * 
 * TopBar dropdown for switching between Preview, Delivery Logs, and Announcements.
 * Follows the PlansTabDropdown pattern.
 * 
 * @module components/admin/emails/EmailsTabDropdown
 */

import { ChevronDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type EmailsTab = 'preview' | 'stats' | 'logs' | 'announcements';

interface EmailsTabDropdownProps {
  activeTab: EmailsTab;
  onTabChange: (tab: EmailsTab) => void;
}

const TABS: Record<EmailsTab, string> = {
  preview: 'Preview',
  stats: 'Stats',
  logs: 'Delivery Logs',
  announcements: 'Announcements',
};

/**
 * Dropdown for selecting the active section in Admin Emails.
 */
export function EmailsTabDropdown({ activeTab, onTabChange }: EmailsTabDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-medium min-w-[140px] justify-between">
          <span>{TABS[activeTab]}</span>
          <ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={4} className="min-w-[140px] space-y-1">
        {(Object.entries(TABS) as [EmailsTab, string][]).map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onTabChange(key)}
            className={cn(activeTab === key && 'bg-accent')}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
