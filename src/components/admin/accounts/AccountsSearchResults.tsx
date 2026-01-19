/**
 * @fileoverview Accounts Search Results Component
 * 
 * Renders account search results for the TopBarSearch dropdown in Admin Accounts page.
 * 
 * @module components/admin/accounts/AccountsSearchResults
 */

import { useMemo } from 'react';
import { User01 } from '@untitledui/icons';
import { TopBarSearchResultItem, TopBarSearchEmptyState } from '@/components/layout/TopBarSearchResultItem';
import { Badge } from '@/components/ui/badge';
import type { AdminAccount } from '@/types/admin';

interface AccountsSearchResultsProps {
  /** Current search query */
  query: string;
  /** All accounts to search through */
  accounts: AdminAccount[];
  /** Callback when an account is selected */
  onSelect: (account: AdminAccount) => void;
}

/**
 * Renders account search results in the TopBarSearch dropdown.
 */
export function AccountsSearchResults({
  query,
  accounts,
  onSelect,
}: AccountsSearchResultsProps) {
  // Filter accounts based on query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchLower = query.toLowerCase();
    return accounts
      .filter(account =>
        account.email?.toLowerCase().includes(searchLower) ||
        account.display_name?.toLowerCase().includes(searchLower) ||
        account.company_name?.toLowerCase().includes(searchLower)
      )
      .slice(0, 8); // Limit to 8 results
  }, [query, accounts]);

  if (results.length === 0) {
    return <TopBarSearchEmptyState message="No accounts found" />;
  }

  return (
    <div>
      {results.map((account) => (
        <TopBarSearchResultItem
          key={account.id}
          icon={<User01 size={16} aria-hidden="true" />}
          title={account.display_name || account.email}
          subtitle={
            <div className="flex items-center gap-2">
              {account.company_name && (
                <span className="truncate">{account.company_name}</span>
              )}
              {account.status && (
                <Badge size="sm" variant={account.status === 'active' ? 'default' : 'secondary'}>
                  {account.status}
                </Badge>
              )}
            </div>
          }
          onClick={() => onSelect(account)}
        />
      ))}
    </div>
  );
}
