/**
 * AdminAccountsSearch Component
 * 
 * TopBar-compatible search input for admin accounts page.
 * Matches userside search patterns with inline clear button.
 * 
 * @module components/admin/accounts/AdminAccountsSearch
 */

import { SearchLg, XClose } from '@untitledui/icons';
import { Input } from '@/components/ui/input';

interface AdminAccountsSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Compact search input for TopBar integration.
 */
export function AdminAccountsSearch({ 
  value, 
  onChange,
  placeholder = 'Search accounts...'
}: AdminAccountsSearchProps) {
  return (
    <div className="relative w-48 lg:w-64">
      <SearchLg 
        size={16} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" 
        aria-hidden="true"
      />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8"
        size="sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
          type="button"
        >
          <XClose size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
