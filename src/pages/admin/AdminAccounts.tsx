/**
 * Admin Accounts Page
 * 
 * Manage all user accounts on the platform.
 * Includes search, filtering, and impersonation capabilities.
 * 
 * @module pages/admin/AdminAccounts
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users01 } from '@untitledui/icons';
import { AccountsTable, AccountFilters, AccountDetailSheet } from '@/components/admin/accounts';
import { useAdminAccounts } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import type { AdminAccountFilters } from '@/types/admin';

/**
 * Accounts management page for Super Admin.
 */
export function AdminAccounts() {
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={Users01} title="Accounts" />,
  }), []);
  useTopBar(topBarConfig);

  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Partial<AdminAccountFilters>>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { accounts, totalCount, loading } = useAdminAccounts({
    ...filters,
    page,
    pageSize: 25,
  });

  const handleSelectAccount = (accountId: string) => {
    navigate(`/admin/accounts/${accountId}`);
  };

  const handleFilterChange = (newFilters: Partial<AdminAccountFilters>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters - no header, TopBar handles page title */}
      <AccountFilters
        filters={filters as AdminAccountFilters}
        onFiltersChange={handleFilterChange}
      />

      {/* Accounts Table */}
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
