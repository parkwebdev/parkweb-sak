import { useMemo, useCallback, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapLibreMap, MapMarker, computeBounds } from '@/components/ui/maplibre-map';
import { LocationAnalyticsSheet } from './LocationAnalyticsSheet';
import { Globe02 } from '@untitledui/icons';

export interface LocationData {
  country: string;
  city?: string;
  lat: number;
  lng: number;
  count: number;
  countryCode?: string;
}

interface VisitorLocationMapProps {
  data: LocationData[];
  loading?: boolean;
}

export function VisitorLocationMap({ data, loading }: VisitorLocationMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    if (data.length === 0) return null;
    return computeBounds(data.map(loc => ({ lng: loc.lng, lat: loc.lat })));
  }, [data]);

  // Convert LocationData to MapMarker format
  const markers: MapMarker[] = useMemo(() => {
    return data.map((location, index) => ({
      id: `${location.country}-${location.city || index}`,
      lng: location.lng,
      lat: location.lat,
      count: location.count,
      country: location.country,
      city: location.city,
      countryCode: location.countryCode,
    }));
  }, [data]);

  // Handle marker click - open sheet with location details
  const handleMarkerClick = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);
  }, []);

  // Calculate total visitors
  const totalVisitors = useMemo(() => {
    return data.reduce((sum, loc) => sum + loc.count, 0);
  }, [data]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <Globe02 size={16} className="text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[calc(100vh-320px)] min-h-[400px] w-full rounded-none" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <Globe02 size={16} className="text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100vh-320px)] min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <Globe02 size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location data available</p>
            <p className="text-xs mt-1">Location data will appear as visitors interact with your widget</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe02 size={16} className="text-muted-foreground" />
              <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{totalVisitors.toLocaleString()} visitors</span>
              <span>•</span>
              <span>{data.length} {data.length === 1 ? 'location' : 'locations'}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[calc(100vh-320px)] min-h-[400px] w-full">
            <MapLibreMap
              center={[0, 20]}
              zoom={1.5}
              markers={markers}
              fitBounds={bounds || undefined}
              fitBoundsPadding={60}
              className="h-full w-full"
              showControls
              onMarkerClick={handleMarkerClick}
            />
          </div>
          <div className="px-4 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Click on a location marker to view detailed analytics for that region
            </p>
          </div>
        </CardContent>
      </Card>

      <LocationAnalyticsSheet
        open={!!selectedMarker}
        onOpenChange={(open) => !open && setSelectedMarker(null)}
        marker={selectedMarker}
        totalVisitors={totalVisitors}
      />
    </>
  );
}
