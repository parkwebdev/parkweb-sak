/**
 * BookingsByLocationChart Component
 * 
 * Compact card displaying booking counts grouped by location.
 * Matches the MetricCardWithChart design with outer muted wrapper.
 * 
 * @module components/analytics/BookingsByLocationChart
 */

import React, { useId } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkerPin01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import type { BookingsByLocationChartProps } from '@/types/analytics';

// Blue gradient colors from darkest to lightest
const BAR_COLORS = [
  'hsl(230, 80%, 45%)',
  'hsl(225, 85%, 55%)',
  'hsl(220, 90%, 65%)',
  'hsl(215, 95%, 72%)',
  'hsl(210, 100%, 80%)',
];

/**
 * Renders a compact horizontal bar chart of bookings grouped by location.
 * Matches MetricCardWithChart styling.
 */
export const BookingsByLocationChart = React.memo(function BookingsByLocationChart({
  data,
  loading = false,
  className,
  animationDelay = 0,
}: BookingsByLocationChartProps & { animationDelay?: number }) {
  const id = useId();
  const prefersReducedMotion = useReducedMotion();
  
  // Transform data for chart (top 5 locations)
  const chartData = data
    .slice(0, 5)
    .map(item => ({
      name: item.locationName.length > 12 
        ? item.locationName.substring(0, 12) + '…' 
        : item.locationName,
      fullName: item.locationName,
      bookings: item.bookings,
      completed: item.completed,
      cancelled: item.cancelled,
      noShow: item.noShow,
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
  if (chartData.length === 0 || total === 0) {
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

      {/* Inner card with chart */}
      <div className="relative flex flex-col gap-2 rounded-t-xl bg-card px-4 py-4 shadow-sm border-t border-border md:px-5">
        {/* Bar Chart */}
        <div className="h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis 
                type="number" 
                hide
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-xs">{item.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.bookings} booking{item.bookings !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="bookings" 
                radius={[0, 4, 4, 0]}
                maxBarSize={16}
                isAnimationActive={!prefersReducedMotion}
                animationDuration={600}
                animationEasing="ease-out"
                label={({ x, y, width, height, name, value }) => (
                  <g>
                    <text 
                      x={x - 4} 
                      y={y + height / 2} 
                      textAnchor="end" 
                      dominantBaseline="middle"
                      className="fill-foreground text-[10px]"
                    >
                      {name}
                    </text>
                    <text 
                      x={x + width + 4} 
                      y={y + height / 2} 
                      textAnchor="start" 
                      dominantBaseline="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {value}
                    </text>
                  </g>
                )}
              >
                {chartData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={BAR_COLORS[index % BAR_COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
});