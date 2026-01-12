/**
 * MRRBreakdownSection Component
 * 
 * Displays MRR trends and movement breakdown.
 * Shows MRR Over Time chart and Quick Ratio.
 * 
 * @module components/admin/revenue/sections/MRRBreakdownSection
 */

import { useMemo } from 'react';
import { MRRChart } from '../MRRChart';
import { QuickRatioCard } from '../QuickRatioCard';
import { MRRMovementChart } from '../MRRMovementChart';
import type { RevenueData } from '@/types/admin';

interface MRRBreakdownSectionProps {
  data: RevenueData | null;
  loading: boolean;
}

export function MRRBreakdownSection({ data, loading }: MRRBreakdownSectionProps) {
  const quickRatio = useMemo(() => {
    if (!data) return 0;
    // Quick Ratio = (New MRR + Expansion MRR) / (Contraction MRR + Churned MRR)
    const positive = (data.newMRR || 0) + (data.expansionMRR || 0);
    const negative = (data.contractionMRR || 0) + (data.churnedMRR || 0);
    return negative > 0 ? positive / negative : positive > 0 ? Infinity : 0;
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Quick Ratio Card */}
      <QuickRatioCard
        quickRatio={quickRatio}
        newMRR={data?.newMRR || 0}
        expansionMRR={data?.expansionMRR || 0}
        contractionMRR={data?.contractionMRR || 0}
        churnedMRR={data?.churnedMRR || 0}
        loading={loading}
      />

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MRRChart data={data?.mrrHistory || []} loading={loading} />
        <MRRMovementChart data={data?.mrrMovementHistory || []} loading={loading} />
      </div>
    </div>
  );
}
