/**
 * Admin Accounts Page
 * 
 * Manage all user accounts on the platform.
 * Includes search, filtering, and impersonation capabilities.
 * 
 * @module pages/admin/AdminAccounts
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountsTable, AccountFilters, AccountDetailSheet } from '@/components/admin/accounts';
import { useAdminAccounts } from '@/hooks/admin';
import type { AdminAccountFilters } from '@/types/admin';

/**
 * Accounts management page for Super Admin.
 */
export function AdminAccounts() {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and subscriptions
          </p>
        </div>
      </div>

      {/* Filters */}
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
