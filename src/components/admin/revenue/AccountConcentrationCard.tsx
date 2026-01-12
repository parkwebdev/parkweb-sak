/**
 * AccountConcentrationCard Component
 * 
 * Displays revenue concentration metrics.
 * Shows what percentage of MRR comes from top accounts.
 * 
 * @module components/admin/revenue/AccountConcentrationCard
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { formatPercentage } from '@/lib/admin/admin-utils';
import { AlertTriangle, CheckCircle } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface AccountConcentrationCardProps {
  top10Percent: number; // % of MRR from top 10% of accounts
  top25Percent: number; // % of MRR from top 25% of accounts
  loading: boolean;
}

export function AccountConcentrationCard({
  top10Percent,
  top25Percent,
  loading,
}: AccountConcentrationCardProps) {
  const riskLevel = useMemo(() => {
    // High concentration risk if top 10% accounts for > 50% of revenue
    if (top10Percent > 50) {
      return {
        label: 'High Risk',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        icon: AlertTriangle,
        description: 'Revenue is heavily concentrated in few accounts',
      };
    }
    if (top10Percent > 30) {
      return {
        label: 'Moderate Risk',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        icon: AlertTriangle,
        description: 'Some revenue concentration, monitor closely',
      };
    }
    return {
      label: 'Healthy',
      color: 'text-success',
      bgColor: 'bg-success/10',
      icon: CheckCircle,
      description: 'Revenue is well distributed across accounts',
    };
  }, [top10Percent]);

  const RiskIcon = riskLevel.icon;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Risk Assessment */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Revenue Concentration</p>
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
              riskLevel.bgColor
            )}>
              <RiskIcon size={16} className={riskLevel.color} />
              <span className={cn('text-sm font-medium', riskLevel.color)}>
                {riskLevel.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{riskLevel.description}</p>
          </div>

          {/* Concentration Bars */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Top 10% of accounts</span>
                <span className="font-semibold">{formatPercentage(top10Percent)} of MRR</span>
              </div>
              <Progress value={top10Percent} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Top 25% of accounts</span>
                <span className="font-semibold">{formatPercentage(top25Percent)} of MRR</span>
              </div>
              <Progress value={top25Percent} className="h-2" />
            </div>
          </div>
        </div>

        {/* Context footer */}
        <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Low concentration (top 10% &lt; 30% of MRR) reduces risk from customer churn
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
