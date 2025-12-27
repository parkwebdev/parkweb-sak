/**
 * DashboardSection Component
 * 
 * Overview dashboard with KPI cards and sparkline charts.
 */

import React from 'react';
import { MetricCardWithChart } from '@/components/dashboard/MetricCardWithChart';
import { ComparisonView } from '@/components/analytics/ComparisonView';

interface DashboardSectionProps {
  // KPI values
  totalConversations: number;
  totalLeads: number;
  conversionRate: string;
  totalBookings: number;
  avgSatisfaction: number;
  containmentRate: number;
  // Trend data
  conversationTrend: { value: number }[];
  leadTrend: { value: number }[];
  conversionTrend: { value: number }[];
  bookingTrend: { value: number }[];
  satisfactionTrend: { value: number }[];
  containmentTrend: { value: number }[];
  // Change calculations
  calculatePeriodChange: (trend: number[]) => number;
  calculatePointChange: (trend: number[]) => number;
  // Comparison
  comparisonMode: boolean;
  comparisonMetrics?: {
    label: string;
    currentValue: number;
    previousValue: number;
    format: 'number' | 'percentage' | 'currency';
  }[];
  currentPeriod?: { start: Date; end: Date };
  previousPeriod?: { start: Date; end: Date };
}

export function DashboardSection({
  totalConversations,
  totalLeads,
  conversionRate,
  totalBookings,
  avgSatisfaction,
  containmentRate,
  conversationTrend,
  leadTrend,
  conversionTrend,
  bookingTrend,
  satisfactionTrend,
  containmentTrend,
  calculatePeriodChange,
  calculatePointChange,
  comparisonMode,
  comparisonMetrics,
  currentPeriod,
  previousPeriod,
}: DashboardSectionProps) {
  // Extract raw values for calculations
  const convTrendValues = conversationTrend.map(d => d.value);
  const leadTrendValues = leadTrend.map(d => d.value);
  const conversionTrendValues = conversionTrend.map(d => d.value);
  const bookingTrendValues = bookingTrend.map(d => d.value);
  const satTrendValues = satisfactionTrend.map(d => d.value);
  const containTrendValues = containmentTrend.map(d => d.value);

  if (comparisonMode && comparisonMetrics && currentPeriod && previousPeriod) {
    return (
      <ComparisonView 
        currentPeriod={currentPeriod}
        previousPeriod={previousPeriod}
        metrics={comparisonMetrics} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Engagement Metrics */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Engagement
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <MetricCardWithChart
            title={totalConversations.toLocaleString()}
            subtitle="Total Conversations"
            description="Chat sessions started with Ari"
            change={calculatePeriodChange(convTrendValues)}
            changeType="percentage"
            changeLabel="vs last period"
            chartData={conversationTrend}
            animationDelay={0}
          />
          <MetricCardWithChart
            title={totalLeads.toLocaleString()}
            subtitle="Total Leads"
            description="Visitors who shared contact info"
            change={calculatePeriodChange(leadTrendValues)}
            changeType="percentage"
            changeLabel="vs last period"
            chartData={leadTrend}
            animationDelay={0.05}
          />
          <MetricCardWithChart
            title={`${conversionRate}%`}
            subtitle="Conversion Rate"
            description="Leads marked as won or converted"
            change={calculatePointChange(conversionTrendValues)}
            changeType="points"
            changeLabel="vs last period"
            chartData={conversionTrend}
            animationDelay={0.1}
          />
        </div>
      </div>

      {/* Outcomes Metrics */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Outcomes
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <MetricCardWithChart
            title={totalBookings.toLocaleString()}
            subtitle="Total Bookings"
            description="Appointments scheduled via Ari"
            change={calculatePeriodChange(bookingTrendValues)}
            changeType="percentage"
            changeLabel="vs last period"
            chartData={bookingTrend}
            animationDelay={0.15}
          />
          <MetricCardWithChart
            title={avgSatisfaction.toFixed(1)}
            subtitle="Avg Satisfaction"
            description="User ratings out of 5 stars"
            change={calculatePointChange(satTrendValues)}
            changeType="points"
            changeLabel="vs last period"
            chartData={satisfactionTrend}
            animationDelay={0.2}
          />
          <MetricCardWithChart
            title={`${containmentRate.toFixed(0)}%`}
            subtitle="AI Containment"
            description="Chats resolved without human help"
            change={calculatePointChange(containTrendValues)}
            changeType="points"
            changeLabel="vs last period"
            chartData={containmentTrend}
            animationDelay={0.25}
          />
        </div>
      </div>
    </div>
  );
}
