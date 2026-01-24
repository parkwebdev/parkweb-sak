/**
 * Plans Tab Dropdown
 * 
 * TopBar dropdown for switching between Plans, Subscriptions, and Stripe sections.
 * Follows the InboxFilterDropdown pattern.
 * 
 * @module components/admin/plans/PlansTabDropdown
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

export type PlansTab = 'plans' | 'subscriptions' | 'stripe';

interface PlansTabDropdownProps {
  activeTab: PlansTab;
  onTabChange: (tab: PlansTab) => void;
}

const TABS: Record<PlansTab, string> = {
  plans: 'Plans',
  subscriptions: 'Subscriptions',
  stripe: 'Stripe',
};

/**
 * Dropdown for selecting the active section in Plans & Billing.
 */
export function PlansTabDropdown({ activeTab, onTabChange }: PlansTabDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-medium min-w-[120px] justify-between">
          <span>{TABS[activeTab]}</span>
          <ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" sideOffset={4} className="min-w-[120px]">
        {(Object.entries(TABS) as [PlansTab, string][]).map(([key, label]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onTabChange(key)}
            className={cn('py-1.5', activeTab === key && 'bg-accent')}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
