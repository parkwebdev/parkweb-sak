/**
 * @fileoverview Accounts TopBar Search Component
 * 
 * Encapsulates search state and results rendering for the Admin Accounts page.
 * Manages its own search query state to prevent parent re-renders.
 * 
 * @module components/admin/accounts/AccountsTopBarSearch
 */

import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { TopBarSearch } from '@/components/layout/TopBar';
import { AccountsSearchResults } from './AccountsSearchResults';
import type { AdminAccount } from '@/types/admin';

interface AccountsTopBarSearchProps {
  /** All accounts to search through */
  accounts: AdminAccount[];
  /** Callback when an account is selected from search results */
  onSelect: (account: AdminAccount) => void;
}

/**
 * Self-contained search component for the Admin Accounts page.
 * Manages search state internally to avoid triggering parent re-renders.
 * Uses refs for data props to ensure stable renderResults callback.
 */
export const AccountsTopBarSearch = memo(function AccountsTopBarSearch({
  accounts,
  onSelect,
}: AccountsTopBarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use refs to avoid closure issues and keep renderResults stable
  const accountsRef = useRef(accounts);
  const onSelectRef = useRef(onSelect);
  
  // Keep refs updated with latest values
  useEffect(() => {
    accountsRef.current = accounts;
    onSelectRef.current = onSelect;
  });
  
  // Stable renderResults with empty deps - reads from refs
  const renderResults = useCallback((query: string) => (
    <AccountsSearchResults
      query={query}
      accounts={accountsRef.current}
      onSelect={onSelectRef.current}
    />
  ), []);

  return (
    <TopBarSearch
      placeholder="Search accounts..."
      value={searchQuery}
      onChange={setSearchQuery}
      renderResults={renderResults}
    />
  );
});
