/**
 * TrafficSourcesSection Component
 * 
 * Traffic source analytics with referrer breakdown.
 */

import React from 'react';
import { TrafficSourceChart } from '@/components/analytics/TrafficSourceChart';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';

interface TrafficSourceData {
  name: string;
  value: number;
  color?: string;
}

interface TrafficSourcesSectionProps {
  trafficSources: TrafficSourceData[];
  loading?: boolean;
}

export function TrafficSourcesSection({
  trafficSources,
  loading = false,
}: TrafficSourcesSectionProps) {
  const totalVisitors = trafficSources.reduce((sum, s) => sum + s.value, 0);
  const topSource = trafficSources.length > 0 
    ? trafficSources.reduce((max, s) => s.value > max.value ? s : max, trafficSources[0])
    : null;

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading traffic source data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total from Sources</p>
          <p className="text-2xl font-bold mt-1">{totalVisitors.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Top Source</p>
          <p className="text-2xl font-bold mt-1 capitalize">{topSource?.name || 'N/A'}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Unique Sources</p>
          <p className="text-2xl font-bold mt-1">{trafficSources.length}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Source Distribution
        </h3>
        <AnimatedList staggerDelay={0.1}>
          <AnimatedItem>
            <TrafficSourceChart 
              data={trafficSources.map(s => ({ name: s.name, value: s.value, color: s.color || '' }))} 
              loading={loading} 
            />
          </AnimatedItem>
        </AnimatedList>
      </div>
    </div>
  );
}
