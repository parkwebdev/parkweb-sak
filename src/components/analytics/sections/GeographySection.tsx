/**
 * GeographySection Component
 * 
 * Analytics section displaying visitor geography:
 * - Interactive visitor location map
 * 
 * @module components/analytics/sections/GeographySection
 */

import { VisitorLocationMap } from '@/components/analytics/VisitorLocationMap';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { LocationData } from '@/types/analytics';

interface GeographySectionProps {
  /** Location data for map markers */
  locationData: LocationData[];
  /** Loading state */
  trafficLoading: boolean;
}

export function GeographySection({
  locationData,
  trafficLoading,
}: GeographySectionProps) {
  return (
    <div className="space-y-6">
      <ErrorBoundary
        fallback={(error) => (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Visitor map failed to load</p>
            <p className="text-xs text-muted-foreground mt-1">{error?.message || 'An unexpected error occurred.'}</p>
          </div>
        )}
      >
        <VisitorLocationMap data={locationData} loading={trafficLoading} />
      </ErrorBoundary>
    </div>
  );
}
