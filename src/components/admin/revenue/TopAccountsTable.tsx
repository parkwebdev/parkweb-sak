/**
 * TopAccountsTable Component
 * 
 * Table showing highest value customers by revenue.
 * 
 * @module components/admin/revenue/TopAccountsTable
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import type { TopAccount } from '@/types/admin';

interface TopAccountsTableProps {
  /** Top accounts data */
  accounts: TopAccount[];
  /** Loading state */
  loading: boolean;
}

/**
 * Top accounts table.
 */
export function TopAccountsTable({ accounts, loading }: TopAccountsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Accounts by Revenue</CardTitle>
        <CardDescription>Highest value customers</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No accounts yet
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account, index) => (
              <div
                key={account.userId}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {account.displayName || account.companyName || account.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{account.planName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium">
                    {formatAdminCurrency(account.mrr)}/mo
                  </p>
                  <p className="text-2xs text-muted-foreground">
                    LTV: {formatAdminCurrency(account.lifetimeValue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
