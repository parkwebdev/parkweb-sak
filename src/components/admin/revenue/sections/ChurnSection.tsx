/**
 * ChurnSection Component
 * 
 * Displays churn analytics and retention metrics.
 * 
 * @module components/admin/revenue/sections/ChurnSection
 */

import { ChurnChart } from '../ChurnChart';
import { ChurnByPlanChart } from '../ChurnByPlanChart';
import type { RevenueData } from '@/types/admin';

interface ChurnSectionProps {
  data: RevenueData | null;
  loading: boolean;
}

export function ChurnSection({ data, loading }: ChurnSectionProps) {
  return (
    <div className="space-y-6">
      {/* Churn Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChurnChart data={data?.churnHistory || []} loading={loading} />
        <ChurnByPlanChart data={data?.churnByPlan || []} loading={loading} />
      </div>
    </div>
  );
}
