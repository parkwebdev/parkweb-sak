/**
 * LeadsSection Component
 * 
 * Analytics section displaying lead metrics including:
 * - Total leads KPI card with sparkline
 * - Conversion rate KPI card with sparkline
 * - Lead conversion chart
 * 
 * @module components/analytics/sections/LeadsSection
 */

import { MetricCardWithChart } from '@/components/analytics/MetricCardWithChart';
import { LeadConversionChart } from '@/components/analytics/LeadConversionChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import ErrorBoundary from '@/components/ErrorBoundary';

interface LeadsSectionProps {
  /** Total number of leads */
  totalLeads: number;
  /** Conversion rate as string percentage */
  conversionRate: string;
  /** Lead trend data for sparkline */
  leadChartData: { value: number }[];
  /** Conversion trend data for sparkline */
  conversionChartData: { value: number }[];
  /** Lead stats for conversion chart */
  leadStats: Array<{ date: string; total: number; [key: string]: string | number }>;
  /** Change value for leads KPI */
  leadChange: number;
  /** Change value for conversion rate KPI */
  conversionChange: number;
  /** Trend value for lead conversion chart */
  leadTrendValue: number;
  /** Loading state */
  loading: boolean;
}

export function LeadsSection({
  totalLeads,
  conversionRate,
  leadChartData,
  conversionChartData,
  leadStats,
  leadChange,
  conversionChange,
  leadTrendValue,
  loading,
}: LeadsSectionProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
        <MetricCardWithChart 
          title={totalLeads.toLocaleString()} 
          subtitle="Total Leads" 
          description="Visitors who shared contact info" 
          change={leadChange} 
          changeType="percentage" 
          changeLabel="vs last period" 
          chartData={leadChartData} 
          animationDelay={0} 
        />
        <MetricCardWithChart 
          title={`${conversionRate}%`} 
          subtitle="Conversion Rate" 
          description="Leads marked as won or converted" 
          change={conversionChange} 
          changeType="points" 
          changeLabel="vs last period" 
          chartData={conversionChartData} 
          animationDelay={0.05} 
        />
      </div>
      
      <AnimatedList staggerDelay={0.1}>
        <AnimatedItem>
          <ErrorBoundary
            fallback={(error) => (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">Lead conversion chart failed to load</p>
                <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
              </div>
            )}
          >
            <LeadConversionChart data={leadStats} trendValue={leadTrendValue} trendPeriod="this month" />
          </ErrorBoundary>
        </AnimatedItem>
      </AnimatedList>
    </div>
  );
}
