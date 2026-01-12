/**
 * AccountsSection Component
 * 
 * Displays top accounts and revenue concentration.
 * 
 * @module components/admin/revenue/sections/AccountsSection
 */

import { TopAccountsTable } from '../TopAccountsTable';
import { AccountConcentrationCard } from '../AccountConcentrationCard';
import type { RevenueData } from '@/types/admin';

interface AccountsSectionProps {
  data: RevenueData | null;
  loading: boolean;
}

export function AccountsSection({ data, loading }: AccountsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Account Concentration */}
      <AccountConcentrationCard
        top10Percent={data?.accountConcentration?.top10Percent || 0}
        top25Percent={data?.accountConcentration?.top25Percent || 0}
        loading={loading}
      />

      {/* Top Accounts Table - Full Width */}
      <TopAccountsTable accounts={data?.topAccounts || []} loading={loading} />
    </div>
  );
}
