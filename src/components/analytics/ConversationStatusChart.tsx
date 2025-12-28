/**
 * ConversationStatusChart Component
 * 
 * Displays a donut chart showing the breakdown of conversation statuses:
 * Active, Closed, and Human Takeover.
 * 
 * @module components/analytics/ConversationStatusChart
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';
import { Skeleton } from '@/components/ui/skeleton';

export interface ConversationStatusChartProps {
  /** Number of active conversations */
  active: number;
  /** Number of closed conversations */
  closed: number;
  /** Number of human takeover conversations */
  humanTakeover: number;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

const STATUS_CONFIG = [
  { key: 'active', label: 'Active', color: 'hsl(var(--status-active))' },
  { key: 'closed', label: 'Closed', color: 'hsl(var(--muted-foreground))' },
  { key: 'humanTakeover', label: 'Human Takeover', color: 'hsl(var(--warning))' },
];

/**
 * Donut chart showing conversation status breakdown.
 */
export const ConversationStatusChart = React.memo(function ConversationStatusChart({
  active,
  closed,
  humanTakeover,
  loading = false,
  className,
}: ConversationStatusChartProps) {
  const prefersReducedMotion = useReducedMotion();

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: springs.smooth,
    },
  }), []);

  const reducedVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
  }), []);

  const total = active + closed + humanTakeover;

  const chartData = useMemo(() => [
    { name: 'Active', value: active, color: STATUS_CONFIG[0].color },
    { name: 'Closed', value: closed, color: STATUS_CONFIG[1].color },
    { name: 'Human Takeover', value: humanTakeover, color: STATUS_CONFIG[2].color },
  ].filter(d => d.value > 0), [active, closed, humanTakeover]);

  if (loading) {
    return (
      <div className={cn('rounded-xl bg-muted/50 border border-border p-4', className)}>
        <Skeleton className="h-4 w-32 mb-4" />
        <div className="flex justify-center">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-muted/50 shadow-sm border border-border',
        className
      )}
      variants={prefersReducedMotion ? reducedVariants : cardVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 md:px-5">
        <h3 className="text-sm font-semibold text-foreground">Status Breakdown</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {total.toLocaleString()} total conversations
        </p>
      </div>

      {/* Inner card with chart */}
      <div className="flex flex-col gap-3 rounded-t-xl bg-card px-4 py-5 shadow-sm border-t border-border md:px-5">
        {total === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No conversation data
          </div>
        ) : (
          <>
            {/* Donut Chart */}
            <div className="relative h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={!prefersReducedMotion}
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active: isActive, payload }) => {
                      if (isActive && payload && payload.length) {
                        const data = payload[0].payload;
                        const percentage = ((data.value / total) * 100).toFixed(1);
                        return (
                          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-sm font-medium text-foreground">{data.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.value.toLocaleString()} ({percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-lg font-semibold text-foreground">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              {STATUS_CONFIG.map((status) => {
                const value = status.key === 'active' ? active : 
                              status.key === 'closed' ? closed : humanTakeover;
                if (value === 0) return null;
                const percentage = ((value / total) * 100).toFixed(0);
                return (
                  <div key={status.key} className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {status.label} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
});
