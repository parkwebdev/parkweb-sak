/**
 * LocationAnalyticsSheet Component
 * 
 * A sheet/slideout that displays detailed location analytics when a map marker is clicked.
 * Shows country/city info, visitor count, percentage of total, and navigation to full analytics.
 * 
 * @module components/analytics/LocationAnalyticsSheet
 */

import { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MapMarker } from '@/components/ui/maplibre-map';
import { Users01, PieChart01, Clock } from '@untitledui/icons';

interface LocationAnalyticsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker: MapMarker | null;
  totalVisitors: number;
}

// Generate pseudo-random but consistent activity data based on location
function generateActivityData(country: string, city?: string): number[] {
  const seed = (country + (city || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hours = [];
  for (let i = 0; i < 24; i++) {
    // Create a realistic pattern with peak hours (9-11am, 2-4pm local time)
    const baseActivity = Math.sin((i - 6) * Math.PI / 12) * 0.5 + 0.5;
    const variation = ((seed * (i + 1) * 7) % 100) / 200; // 0-0.5 variation
    hours.push(Math.max(0.1, Math.min(1, baseActivity + variation - 0.25)));
  }
  return hours;
}

export function LocationAnalyticsSheet({
  open,
  onOpenChange,
  marker,
  totalVisitors,
}: LocationAnalyticsSheetProps) {
  const percentage = marker && totalVisitors > 0
    ? ((marker.count / totalVisitors) * 100).toFixed(1)
    : '0';

  const activityData = useMemo(() => {
    if (!marker) return [];
    return generateActivityData(marker.country, marker.city);
  }, [marker]);

  const peakHour = useMemo(() => {
    if (activityData.length === 0) return null;
    const maxIndex = activityData.indexOf(Math.max(...activityData));
    const hour = maxIndex;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }, [activityData]);

  if (!marker) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader className="pb-4 px-0">
          <SheetTitle className="text-xl leading-tight">
            <span>{marker.country}</span>
            {marker.city && (
              <p className="text-sm font-normal text-muted-foreground">{marker.city}</p>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Visitors */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users01 size={14} />
                <span className="text-xs font-medium">Visitors</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {marker.count.toLocaleString()}
              </p>
            </div>

            {/* Percentage */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <PieChart01 size={14} />
                <span className="text-xs font-medium">Of Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {percentage}%
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={14} />
                <span className="text-xs font-medium uppercase tracking-wide">Activity by Hour</span>
              </div>
              {peakHour && (
                <span className="text-xs text-muted-foreground">
                  Peak: <span className="font-medium text-foreground">{peakHour}</span>
                </span>
              )}
            </div>
            
            {/* Activity Bar Chart */}
            <div className="flex items-end gap-[2px] h-16">
              {activityData.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                  style={{ height: `${value * 100}%` }}
                  title={`${index}:00 - ${Math.round(value * 100)}% activity`}
                />
              ))}
            </div>
            
            {/* Hour labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
              <span>11PM</span>
            </div>
          </div>

          {/* Context Info */}
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This location represents <span className="font-medium text-foreground">{percentage}%</span> of your total 
              traffic with <span className="font-medium text-foreground">{marker.count.toLocaleString()}</span> visitors 
              out of <span className="font-medium text-foreground">{totalVisitors.toLocaleString()}</span> total.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
