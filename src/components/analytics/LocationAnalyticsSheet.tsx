/**
 * LocationAnalyticsSheet Component
 * 
 * A sheet/slideout that displays detailed location analytics when a map marker is clicked.
 * Shows country/city info, visitor count, percentage of total, and navigation to full analytics.
 * 
 * @module components/analytics/LocationAnalyticsSheet
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MapMarker } from '@/components/ui/maplibre-map';
import { Users01, PieChart01, MarkerPin01 } from '@untitledui/icons';

interface LocationAnalyticsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker: MapMarker | null;
  totalVisitors: number;
}

// Country code to flag emoji helper
function getFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
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

  if (!marker) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">{getFlagEmoji(marker.countryCode)}</span>
            Location Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Location Name */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MarkerPin01 size={14} />
              <span className="text-xs font-medium uppercase tracking-wide">Location</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              {marker.country}
            </h3>
            {marker.city && (
              <p className="text-sm text-muted-foreground">{marker.city}</p>
            )}
          </div>

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
