import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, MapTileLayer, MapCircleMarker, MapTooltip, MapFitBounds } from '@/components/ui/map';
import { Globe02 } from '@untitledui/icons/Globe02';
import L from 'leaflet';

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
}

export function VisitorLocationMap({ data, loading }: VisitorLocationMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate total for percentages
  const total = useMemo(() => data.reduce((sum, loc) => sum + loc.count, 0), [data]);
  
  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    if (data.length === 0) return null;
    
    const latLngs = data.map(loc => [loc.lat, loc.lng] as [number, number]);
    return L.latLngBounds(latLngs);
  }, [data]);
  
  // Calculate circle radius based on visitor count (min 6, max 30)
  const getRadius = (count: number) => {
    if (total === 0) return 6;
    const percentage = count / total;
    return Math.max(6, Math.min(30, 6 + percentage * 50));
  };
  
  if (loading || !mounted) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Globe02 className="h-4 w-4 text-muted-foreground" />
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
            <Globe02 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <div className="text-center text-muted-foreground">
            <Globe02 className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location data available</p>
            <p className="text-xs mt-1">Location data will appear as visitors interact with your widget</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe02 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-medium">Visitor Locations</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            {data.length} {data.length === 1 ? 'country' : 'countries'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[350px] w-full">
          <Map
            center={[20, 0]}
            zoom={2}
            scrollWheelZoom={false}
            className="h-full w-full z-0"
            style={{ background: 'hsl(var(--muted))' }}
          >
            <MapTileLayer />
            {bounds && <MapFitBounds bounds={bounds} options={{ maxZoom: 5 }} />}
            {data.map((location, index) => (
              <MapCircleMarker
                key={`${location.country}-${location.city || index}`}
                center={[location.lat, location.lng]}
                radius={getRadius(location.count)}
                pathOptions={{
                  color: 'hsl(var(--primary))',
                  fillColor: 'hsl(var(--primary))',
                  fillOpacity: 0.6,
                  weight: 2,
                }}
              >
                <MapTooltip>
                  <div className="text-sm font-medium">{location.country}</div>
                  {location.city && (
                    <div className="text-xs text-muted-foreground">{location.city}</div>
                  )}
                  <div className="text-xs mt-1">
                    <span className="font-semibold">{location.count}</span> visitor{location.count !== 1 ? 's' : ''}
                    <span className="text-muted-foreground ml-1">
                      ({total > 0 ? ((location.count / total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </MapTooltip>
              </MapCircleMarker>
            ))}
          </Map>
        </div>
      </CardContent>
    </Card>
  );
}
