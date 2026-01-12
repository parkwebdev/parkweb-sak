/**
 * QuickRatioCard Component
 * 
 * Displays the SaaS Quick Ratio metric with MRR movement breakdown.
 * Quick Ratio = (New MRR + Expansion MRR) / (Contraction MRR + Churned MRR)
 * 
 * @module components/admin/revenue/QuickRatioCard
 */

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAdminCurrency } from '@/lib/admin/admin-utils';
import { TrendUp01, TrendDown01, Minus } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface QuickRatioCardProps {
  quickRatio: number;
  newMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  churnedMRR: number;
  loading: boolean;
}

export function QuickRatioCard({
  quickRatio,
  newMRR,
  expansionMRR,
  contractionMRR,
  churnedMRR,
  loading,
}: QuickRatioCardProps) {
  const ratioInfo = useMemo(() => {
    if (quickRatio === Infinity) {
      return { label: 'Excellent', color: 'text-success', description: 'No churn or contraction' };
    }
    if (quickRatio >= 4) {
      return { label: 'Excellent', color: 'text-success', description: 'Very healthy growth' };
    }
    if (quickRatio >= 2) {
      return { label: 'Good', color: 'text-success', description: 'Sustainable growth' };
    }
    if (quickRatio >= 1) {
      return { label: 'Fair', color: 'text-warning', description: 'Barely growing' };
    }
    return { label: 'Poor', color: 'text-destructive', description: 'Losing revenue' };
  }, [quickRatio]);

  const netMRR = (newMRR + expansionMRR) - (contractionMRR + churnedMRR);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
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
          {/* Quick Ratio Display */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Quick Ratio</p>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-bold tracking-tight">
                {quickRatio === Infinity ? '∞' : quickRatio.toFixed(1)}
              </p>
              <span className={cn('text-sm font-medium', ratioInfo.color)}>
                {ratioInfo.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{ratioInfo.description}</p>
            
            {/* Net MRR Change */}
            <div className="flex items-center gap-2 pt-2">
              {netMRR >= 0 ? (
                <TrendUp01 size={16} className="text-success" />
              ) : (
                <TrendDown01 size={16} className="text-destructive" />
              )}
              <span className={cn(
                'text-sm font-medium',
                netMRR >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {netMRR >= 0 ? '+' : ''}{formatAdminCurrency(netMRR)} net MRR
              </span>
            </div>
          </div>

          {/* MRR Movement Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">New MRR</span>
              </div>
              <p className="text-lg font-semibold text-success">
                +{formatAdminCurrency(newMRR)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Expansion MRR</span>
              </div>
              <p className="text-lg font-semibold text-primary">
                +{formatAdminCurrency(expansionMRR)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs text-muted-foreground">Contraction MRR</span>
              </div>
              <p className="text-lg font-semibold text-warning">
                -{formatAdminCurrency(contractionMRR)}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">Churned MRR</span>
              </div>
              <p className="text-lg font-semibold text-destructive">
                -{formatAdminCurrency(churnedMRR)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer with formula */}
        <div className="mt-4 px-3 py-2 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            Quick Ratio = (New + Expansion) ÷ (Contraction + Churned). A ratio above 4 indicates healthy SaaS growth.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
