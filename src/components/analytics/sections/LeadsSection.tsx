/**
 * LeadsSection Component
 * 
 * Detailed lead analytics with conversion funnel.
 */

import React from 'react';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { LeadStageStats } from '@/hooks/useAnalytics';

interface LeadsSectionProps {
  leadStats: LeadStageStats[];
  totalLeads: number;
  conversionRate: string;
  leadTrend: { value: number }[];
  conversionTrend: { value: number }[];
  calculatePeriodChange: (trend: number[]) => number;
  calculatePointChange: (trend: number[]) => number;
  loading?: boolean;
}

export function LeadsSection({
  leadStats,
  totalLeads,
  conversionRate,
  leadTrend,
  conversionTrend,
  calculatePeriodChange,
  calculatePointChange,
  loading = false,
}: LeadsSectionProps) {
  const leadTrendValues = leadTrend.map(d => d.value);
  const conversionTrendValues = conversionTrend.map(d => d.value);
  
  // Calculate converted leads
  const convertedLeads = leadStats.reduce((sum, stat) => {
    const converted = (stat.converted as number) || (stat.won as number) || 0;
    return sum + converted;
  }, 0);

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading lead data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <MetricCardWithChart
          title={totalLeads.toLocaleString()}
          subtitle="Total Leads"
          description="Visitors who shared contact info"
          change={calculatePeriodChange(leadTrendValues)}
          changeType="percentage"
          changeLabel="vs last period"
          chartData={leadTrend}
          animationDelay={0}
        />
        <MetricCardWithChart
          title={convertedLeads.toLocaleString()}
          subtitle="Converted"
          description="Leads marked as won"
          change={0}
          changeType="percentage"
          changeLabel="current"
          chartData={[]}
          animationDelay={0.05}
        />
        <MetricCardWithChart
          title={`${conversionRate}%`}
          subtitle="Conversion Rate"
          description="Lead to customer rate"
          change={calculatePointChange(conversionTrendValues)}
          changeType="points"
          changeLabel="vs last period"
          chartData={conversionTrend}
          animationDelay={0.1}
        />
      </div>

      {/* Conversion Funnel */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Lead Stages
        </h3>
        <AnimatedList staggerDelay={0.1}>
          <AnimatedItem>
            <LeadConversionChart data={leadStats} />
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
