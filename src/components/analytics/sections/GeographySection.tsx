/**
 * GeographySection Component
 * 
 * Geographic analytics with visitor location map.
 */

import React from 'react';
import { VisitorLocationMap } from '@/components/analytics/VisitorLocationMap';
import ErrorBoundary from '@/components/ErrorBoundary';

interface LocationData {
  country: string;
  city?: string;
  lat: number;
  lng: number;
  count: number;
}

interface GeographySectionProps {
  locationData: LocationData[];
  mapboxToken?: string;
  loading?: boolean;
}

export function GeographySection({
  locationData,
  mapboxToken,
  loading = false,
}: GeographySectionProps) {
  // Calculate totals
  const totalVisitors = locationData.reduce((sum, loc) => sum + loc.count, 0);
  const uniqueCountries = new Set(locationData.map(loc => loc.country)).size;
  const topCountry = locationData.length > 0 
    ? locationData.reduce((max, loc) => loc.count > max.count ? loc : max, locationData[0])
    : null;

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading geographic data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Visitors</p>
          <p className="text-2xl font-bold mt-1">{totalVisitors.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Countries</p>
          <p className="text-2xl font-bold mt-1">{uniqueCountries}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Top Country</p>
          <p className="text-2xl font-bold mt-1">{topCountry?.country || 'N/A'}</p>
        </div>
      </div>

      {/* Location Map */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Visitor Locations
        </h3>
        <ErrorBoundary
          fallback={(error) => (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">Visitor map failed to load</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error?.message || 'An unexpected error occurred while rendering the map.'}
              </p>
            </div>
          )}
        >
          <VisitorLocationMap data={locationData} loading={loading} mapboxToken={mapboxToken} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
