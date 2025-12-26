import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MapboxMap, MapMarker, computeBounds } from '@/components/ui/mapbox-map';
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
  mapboxToken?: string;
}

export function VisitorLocationMap({ data, loading, mapboxToken }: VisitorLocationMapProps) {
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
          <Skeleton className="h-[400px] w-full rounded-none" />
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
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="text-center text-muted-foreground">
            <Globe02 size={40} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location data available</p>
            <p className="text-xs mt-1">Location data will appear as visitors interact with your widget</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <Skeleton className="h-[400px] w-full rounded-none" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total visitors for header
  const totalVisitors = data.reduce((sum, loc) => sum + loc.count, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
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
        <div className="h-[400px] w-full">
          <MapboxMap
            accessToken={mapboxToken}
            center={[0, 20]}
            zoom={1.5}
            markers={markers}
            fitBounds={bounds || undefined}
            fitBoundsPadding={60}
            className="h-full w-full"
            showControls
          />
        </div>
      </CardContent>
    </Card>
  );
}
