/**
 * AccountFilters Component
 * 
 * Search and filter controls for accounts table.
 * 
 * @module components/admin/accounts/AccountFilters
 */

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchLg } from '@untitledui/icons';
import type { AdminAccountFilters } from '@/types/admin';

interface AccountFiltersProps {
  filters: AdminAccountFilters;
  onFiltersChange: (filters: AdminAccountFilters) => void;
}

/**
 * Filter controls for accounts table.
 */
export function AccountFilters({ filters, onFiltersChange }: AccountFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <SearchLg
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search by email, name, or company..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value as AdminAccountFilters['status'],
          })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort By */}
      <Select
        value={filters.sortBy}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            sortBy: value as AdminAccountFilters['sortBy'],
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Created Date</SelectItem>
          <SelectItem value="last_active">Last Active</SelectItem>
          <SelectItem value="mrr">MRR</SelectItem>
          <SelectItem value="display_name">Name</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Order */}
      <Select
        value={filters.sortOrder}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            sortOrder: value as AdminAccountFilters['sortOrder'],
          })
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest First</SelectItem>
          <SelectItem value="asc">Oldest First</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
