/**
 * BookingsByLocationChart Component
 * 
 * Compact card displaying booking counts grouped by location using a Treemap.
 * Scales well for 20+ locations. Matches MetricCardWithChart styling.
 * 
 * @module components/analytics/BookingsByLocationChart
 */

import React, { useId } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkerPin01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import type { BookingsByLocationChartProps } from '@/types/analytics';

// Blue gradient colors from darkest to lightest
const COLORS = [
  'hsl(230, 80%, 45%)',
  'hsl(225, 85%, 52%)',
  'hsl(220, 90%, 58%)',
  'hsl(215, 92%, 64%)',
  'hsl(210, 95%, 70%)',
  'hsl(205, 97%, 75%)',
  'hsl(200, 100%, 80%)',
];

// Custom content renderer for Treemap cells
const TreemapCell = (props: any) => {
  const { x, y, width, height, name, bookings, index, colors } = props;
  
  // Skip rendering if missing required props or tiny cells
  if (!name || !colors || width < 4 || height < 4) return null;
  
  const colorIndex = Math.min(index ?? 0, colors.length - 1);
  const fill = colors[colorIndex];
  
  // Only show text if cell is large enough
  const showName = width > 40 && height > 20;
  const showCount = width > 30 && height > 30;
  
  // Truncate name if needed
  const maxChars = Math.floor(width / 7);
  const displayName = name.length > maxChars ? name.substring(0, maxChars) + '…' : name;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={4}
        ry={4}
        stroke="hsl(var(--card))"
        strokeWidth={2}
      />
      {showName && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showCount ? 6 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white text-[10px] font-medium"
          style={{ pointerEvents: 'none' }}
        >
          {displayName}
        </text>
      )}
      {showCount && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white/80 text-[9px]"
          style={{ pointerEvents: 'none' }}
        >
          {bookings}
        </text>
      )}
    </g>
  );
};

/**
 * Renders a treemap of bookings grouped by location.
 * Scales well for many locations.
 */
export const BookingsByLocationChart = React.memo(function BookingsByLocationChart({
  data,
  loading = false,
  className,
  animationDelay = 0,
}: BookingsByLocationChartProps & { animationDelay?: number }) {
  const id = useId();
  const prefersReducedMotion = useReducedMotion();
  
  // Sort by bookings descending and transform for treemap
  const sortedData = [...data].sort((a, b) => b.bookings - a.bookings);
  const treemapData = sortedData.map((item, index) => ({
    name: item.locationName,
    size: item.bookings,
    bookings: item.bookings,
    completed: item.completed,
    cancelled: item.cancelled,
    noShow: item.noShow,
    index,
    colors: COLORS,
  }));

  const total = data.reduce((sum, item) => sum + item.bookings, 0);
  const locationCount = data.length;

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        ...springs.smooth,
        delay: animationDelay,
      }
    },
  };

  const reducedVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0, delay: animationDelay } },
  };

  // Loading state
  if (loading) {
    return (
      <div className={cn(
        "flex flex-col justify-between overflow-hidden rounded-xl bg-muted/50 shadow-sm border border-border",
        className
      )}>
        <div className="px-4 pt-3 pb-2 md:px-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48 mt-1" />
        </div>
        <div className="relative flex flex-col gap-4 rounded-t-xl bg-card px-4 py-5 shadow-sm border-t border-border">
          <Skeleton className="h-[100px] w-full" />
        </div>
      </div>
    );
  }

  // Empty state
  if (treemapData.length === 0 || total === 0) {
    return (
      <motion.div 
        className={cn(
          "flex flex-col justify-between overflow-hidden rounded-xl bg-muted/50 shadow-sm border border-border",
          className
        )}
        variants={prefersReducedMotion ? reducedVariants : cardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="px-4 pt-3 pb-2 md:px-5">
          <h3 className="text-sm font-semibold text-foreground">By Location</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Bookings per location</p>
        </div>
        <div className="relative flex flex-col items-center justify-center gap-2 rounded-t-xl bg-card px-4 py-8 shadow-sm border-t border-border">
          <MarkerPin01 size={20} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center">No locations yet</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={cn(
        "flex flex-col justify-between overflow-hidden rounded-xl bg-muted/50 shadow-sm border border-border",
        className
      )}
      variants={prefersReducedMotion ? reducedVariants : cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Subtitle + Description in outer wrapper */}
      <div className="px-4 pt-3 pb-2 md:px-5">
        <h3 className="text-sm font-semibold text-foreground">By Location</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locationCount} location{locationCount !== 1 ? 's' : ''} • {total.toLocaleString()} total
        </p>
      </div>

      {/* Inner card with treemap */}
      <div className="relative flex flex-col gap-2 rounded-t-xl bg-card px-4 py-4 shadow-sm border-t border-border md:px-5">
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="hsl(var(--card))"
              content={<TreemapCell />}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={600}
            >
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-xs">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.bookings} booking{item.bookings !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
});
