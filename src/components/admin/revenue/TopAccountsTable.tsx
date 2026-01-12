/**
 * TopAccountsTable Component
 * 
 * List of top accounts by MRR with consistent patterns.
 * Uses shared ChartCardHeader for header consistency.
 * 
 * @module components/admin/revenue/TopAccountsTable
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCardHeader } from '@/components/analytics/ChartCardHeader';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import type { TopAccount } from '@/types/admin';

interface TopAccountsTableProps {
  /** Top accounts data */
  accounts: TopAccount[];
  /** Loading state */
  loading: boolean;
}

/**
 * Top accounts by revenue with consistent analytics patterns.
 */
export function TopAccountsTable({ accounts, loading }: TopAccountsTableProps) {
  const { totalMRR, contextSummary } = useMemo(() => {
    const total = accounts.reduce((sum, acc) => sum + acc.mrr, 0);
    return {
      totalMRR: total,
      contextSummary: `${formatAdminCurrency(total)} from top ${accounts.length} accounts`,
    };
  }, [accounts]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Top Accounts"
          contextSummary={contextSummary}
        />
        
        {accounts.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No account data available
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {accounts.slice(0, 5).map((account, index) => {
                const initials = (account.displayName || account.email)
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div 
                    key={account.userId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <span className="text-xs text-muted-foreground w-4 tabular-nums">
                      {index + 1}
                    </span>
                    
                    {/* Avatar */}
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {account.displayName || account.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {account.companyName || account.email}
                      </p>
                    </div>
                    
                    {/* Plan badge */}
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {account.planName}
                    </Badge>
                    
                    {/* MRR */}
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {formatAdminCurrency(account.mrr)}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Context footer */}
            <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
              <p className="text-xs text-muted-foreground">
                Combined LTV: {formatAdminCurrency(accounts.reduce((sum, a) => sum + a.lifetimeValue, 0))}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
