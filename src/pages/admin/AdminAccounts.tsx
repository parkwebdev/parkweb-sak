/**
 * Admin Accounts Page
 * 
 * Manage all user accounts on the platform.
 * Includes search, filtering, and impersonation capabilities.
 * 
 * @module pages/admin/AdminAccounts
 */

import { useState, useMemo, useCallback } from 'react';
import { Users01 } from '@untitledui/icons';
import { AccountsTable, AccountDetailSheet, AdminAccountsSearch, AdminAccountsFilters } from '@/components/admin/accounts';
import { useAdminAccounts } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import type { AdminAccountFilters } from '@/types/admin';

/**
 * Accounts management page for Super Admin.
 */
export function AdminAccounts() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Partial<AdminAccountFilters>>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const handleFilterChange = useCallback((newFilters: Partial<AdminAccountFilters>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  }, []);

  // Configure top bar with search on left, filters on right
  const topBarConfig = useMemo(() => ({
    left: (
      <div className="flex items-center gap-3">
        <TopBarPageContext icon={Users01} title="Accounts" />
        <AdminAccountsSearch 
          value={filters.search || ''} 
          onChange={(search) => handleFilterChange({ ...filters, search })} 
        />
      </div>
    ),
    right: (
      <AdminAccountsFilters
        filters={filters}
        onFiltersChange={handleFilterChange}
      />
    ),
  }), [filters, handleFilterChange]);
  useTopBar(topBarConfig);

  const { accounts, totalCount, loading } = useAdminAccounts({
    ...filters,
    page,
    pageSize: 25,
  });

  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Accounts Table - filters are now in TopBar */}
      <AccountsTable
        accounts={accounts}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={25}
        onPageChange={setPage}
        onSelectAccount={handleSelectAccount}
      />

      {/* Detail Sheet (optional - can navigate to detail page instead) */}
      <AccountDetailSheet
        accountId={selectedAccountId}
        open={!!selectedAccountId}
        onOpenChange={(open) => !open && setSelectedAccountId(null)}
      />
    </div>
  );
}
