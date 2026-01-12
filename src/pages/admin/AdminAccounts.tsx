/**
 * Admin Accounts Page
 * 
 * Manage all user accounts on the platform.
 * Includes search, filtering, and impersonation capabilities.
 * 
 * @module pages/admin/AdminAccounts
 */

import { useState, useMemo, useCallback } from 'react';
import { Users01, Download01 } from '@untitledui/icons';
import { AccountsTable, AccountDetailSheet, AdminAccountsSearch, AdminAccountsFilters } from '@/components/admin/accounts';
import { useAdminAccounts } from '@/hooks/admin';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/lib/admin/admin-utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
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

  const { accounts, totalCount, loading } = useAdminAccounts({
    ...filters,
    page,
    pageSize: 25,
  });

  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
  }, []);

  const handleImpersonate = useCallback((userId: string) => {
    // TODO: Implement impersonation logic
    toast.info('Impersonation will be implemented');
  }, []);

  const handleExport = useCallback(() => {
    if (accounts.length === 0) {
      toast.error('No accounts to export');
      return;
    }
    
    exportToCSV(
      accounts.map(a => ({
        name: a.display_name || '',
        email: a.email,
        company: a.company_name || '',
        status: a.status,
        plan: a.plan_name || 'Free',
        role: a.role,
        created: format(new Date(a.created_at), 'yyyy-MM-dd'),
      })),
      'accounts',
      [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'company', label: 'Company' },
        { key: 'status', label: 'Status' },
        { key: 'plan', label: 'Plan' },
        { key: 'role', label: 'Role' },
        { key: 'created', label: 'Created' },
      ]
    );
    toast.success('Accounts exported');
  }, [accounts]);

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
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download01 size={16} className="mr-2" aria-hidden="true" />
          Export
        </Button>
        <AdminAccountsFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
        />
      </div>
    ),
  }), [filters, handleFilterChange, handleExport]);
  useTopBar(topBarConfig);

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
        onImpersonate={handleImpersonate}
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
