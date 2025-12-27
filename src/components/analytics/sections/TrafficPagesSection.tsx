/**
 * TrafficPagesSection Component
 * 
 * Top pages analytics with landing page performance.
 */

import React from 'react';
import { TopPagesChart } from '@/components/analytics/TopPagesChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

interface LandingPageData {
  url: string;
  visits: number;
  conversions: number;
}

interface TrafficPagesSectionProps {
  landingPages: LandingPageData[];
  loading?: boolean;
}

export function TrafficPagesSection({
  landingPages,
  loading = false,
}: TrafficPagesSectionProps) {
  const totalVisits = landingPages.reduce((sum, p) => sum + p.visits, 0);
  const totalConversions = landingPages.reduce((sum, p) => sum + p.conversions, 0);
  const avgConversionRate = totalVisits > 0 
    ? ((totalConversions / totalVisits) * 100).toFixed(1) 
    : '0';

  const chartData = landingPages.map(page => ({
    url: page.url,
    visits: page.visits,
    avgDuration: 0,
    conversions: page.conversions,
  }));

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading page data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Page Visits</p>
          <p className="text-2xl font-bold mt-1">{totalVisits.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Conversions</p>
          <p className="text-2xl font-bold mt-1">{totalConversions.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Avg Conversion Rate</p>
          <p className="text-2xl font-bold mt-1">{avgConversionRate}%</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Top Pages
        </h3>
        <AnimatedList staggerDelay={0.1}>
          <AnimatedItem>
            <TopPagesChart data={chartData} loading={loading} />
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
