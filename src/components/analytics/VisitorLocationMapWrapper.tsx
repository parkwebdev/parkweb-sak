/**
 * VisitorLocationMapWrapper
 * 
 * Lazy-loading wrapper for the VisitorLocationMap component.
 * Defers loading of MapLibre GL (~180KB) until the map is needed.
 * 
 * @module components/analytics/VisitorLocationMapWrapper
 */

import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe02 } from '@untitledui/icons';
import type { LocationData } from '@/types/analytics';

const VisitorLocationMap = lazy(() =>
  import('./VisitorLocationMap').then((m) => ({ default: m.VisitorLocationMap }))
);

interface VisitorLocationMapWrapperProps {
  data: LocationData[];
  loading?: boolean;
}

/** Skeleton fallback for map loading */
function MapSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center gap-2">
          <Globe02 size={16} className="text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">Visitor Locations</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Skeleton className="h-[400px] w-full" />
      </CardContent>
    </Card>
  );
}

export function VisitorLocationMapWrapper({ data, loading }: VisitorLocationMapWrapperProps) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <VisitorLocationMap data={data} loading={loading} />
    </Suspense>
  );
}
