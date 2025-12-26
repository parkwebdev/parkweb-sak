import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapboxMap, computeBounds } from '@/components/ui/mapbox-map';
import { Globe02 } from '@untitledui/icons';

export interface LocationData {
  country: string;
  city?: string;
  lat: number;
  lng: number;
  count: number;
}

interface VisitorLocationMapProps {
  data: LocationData[];
  loading?: boolean;
  mapboxToken?: string;
}

export function VisitorLocationMap({ data, loading, mapboxToken }: VisitorLocationMapProps) {
  // Calculate total for percentages
  const total = useMemo(() => data.reduce((sum, loc) => sum + loc.count, 0), [data]);
  
  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    if (data.length === 0) return null;
    return computeBounds(data.map(loc => ({ lng: loc.lng, lat: loc.lat })));
  }, [data]);
  
  // Calculate circle radius based on visitor count (min 6, max 30)
  const getRadius = (count: number) => {
    if (total === 0) return 6;
    const percentage = count / total;
    return Math.max(6, Math.min(30, 6 + percentage * 50));
  };

  // Build markers array for Mapbox
  const markers = useMemo(() => {
    return data.map((location, index) => {
      const percentage = total > 0 ? ((location.count / total) * 100).toFixed(1) : '0';
      return {
        id: `${location.country}-${location.city || index}`,
        lng: location.lng,
        lat: location.lat,
        radius: getRadius(location.count),
        color: 'hsl(var(--primary))',
        label: `
          <div style="font-size: 14px; font-weight: 500; color: hsl(var(--foreground));">${location.country}</div>
          ${location.city ? `<div style="font-size: 12px; color: hsl(var(--muted-foreground));">${location.city}</div>` : ''}
          <div style="font-size: 12px; margin-top: 4px;">
            <span style="font-weight: 600;">${location.count}</span> visitor${location.count !== 1 ? 's' : ''}
            <span style="color: hsl(var(--muted-foreground)); margin-left: 4px;">(${percentage}%)</span>
          </div>
        `,
      };
    });
  }, [data, total]);
  
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe02 size={16} className="text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[350px] w-full rounded-none" />
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe02 size={16} className="text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <div className="text-center text-muted-foreground">
            <Globe02 size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location data available</p>
            <p className="text-xs mt-1">Location data will appear as visitors interact with your widget</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state if no token yet
  if (!mapboxToken) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe02 size={16} className="text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[350px] w-full rounded-none" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe02 size={16} className="text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? 'country' : 'countries'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[350px] w-full">
          <MapboxMap
            accessToken={mapboxToken}
            center={[0, 20]}
            zoom={1.5}
            markers={markers}
            fitBounds={bounds || undefined}
            fitBoundsPadding={50}
            className="h-full w-full"
            style={{ background: 'hsl(var(--muted))' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
