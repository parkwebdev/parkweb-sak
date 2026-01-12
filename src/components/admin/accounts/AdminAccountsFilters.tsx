/**
 * AdminAccountsFilters Component
 * 
 * Compact dropdown filters for TopBar right section.
 * Matches userside patterns like LeadsSortDropdown and InboxFilterDropdown.
 * 
 * @module components/admin/accounts/AdminAccountsFilters
 */

import React from 'react';
import { ChevronDown, SwitchVertical01, ArrowUp, ArrowDown, FilterLines } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { AdminAccountFilters } from '@/types/admin';

interface AdminAccountsFiltersProps {
  filters: Partial<AdminAccountFilters>;
  onFiltersChange: (filters: Partial<AdminAccountFilters>) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status', dotColor: 'bg-muted-foreground' },
  { value: 'active', label: 'Active', dotColor: 'bg-status-active' },
  { value: 'inactive', label: 'Inactive', dotColor: 'bg-status-draft' },
  { value: 'suspended', label: 'Suspended', dotColor: 'bg-status-suspended' },
] as const;

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created' },
  { value: 'last_login_at', label: 'Last Login' },
  { value: 'mrr', label: 'MRR' },
  { value: 'display_name', label: 'Name' },
] as const;

/**
 * Compact filter dropdowns for TopBar.
 */
export const AdminAccountsFilters = React.memo(function AdminAccountsFilters({
  filters,
  onFiltersChange,
}: AdminAccountsFiltersProps) {
  const currentStatus = filters.status || 'all';
  const currentSortBy = filters.sortBy || 'created_at';
  const currentSortOrder = filters.sortOrder || 'desc';

  const activeFilterCount = (currentStatus !== 'all' ? 1 : 0);

  const handleStatusChange = (status: typeof STATUS_OPTIONS[number]['value']) => {
    onFiltersChange({ ...filters, status });
  };

  const handleSortChange = (sortBy: typeof SORT_OPTIONS[number]['value']) => {
    // Toggle direction if same column, otherwise use current direction
    if (sortBy === currentSortBy) {
      onFiltersChange({
        ...filters,
        sortOrder: currentSortOrder === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onFiltersChange({
        ...filters,
        sortBy,
      });
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      ...filters,
      status: 'all',
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5"
          >
            <FilterLines size={14} aria-hidden="true" />
            <span className="text-xs">Status</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-2xs font-medium px-1">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={14} className="text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-popover">
          <DropdownMenuLabel className="text-xs">Filter by status</DropdownMenuLabel>
          {STATUS_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={cn(
                'flex items-center gap-2',
                currentStatus === option.value && 'bg-accent'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', option.dotColor)} />
              {option.label}
            </DropdownMenuItem>
          ))}
          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearFilters} className="text-muted-foreground">
                Clear filters
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5"
          >
            <SwitchVertical01 size={14} aria-hidden="true" />
            <span className="text-xs">Sort</span>
            <ChevronDown size={14} className="text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-popover">
          <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className="flex items-center justify-between"
            >
              <span>{option.label}</span>
              {currentSortBy === option.value && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  {currentSortOrder === 'asc' ? (
                    <ArrowUp size={14} aria-hidden="true" />
                  ) : (
                    <ArrowDown size={14} aria-hidden="true" />
                  )}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
