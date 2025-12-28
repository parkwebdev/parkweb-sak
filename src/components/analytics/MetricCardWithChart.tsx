/**
 * @fileoverview Metric card with sparkline chart and trend indicator.
 * Displays a KPI value with percentage change and animated area chart.
 */

import React, { useId, useMemo } from "react";
import { TrendUp01, TrendDown01, DotsVertical } from "@untitledui/icons";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { springs } from "@/lib/motion-variants";

interface MetricCardWithChartProps {
  title: string;
  subtitle: string;
  /** Brief explanation of what this metric measures */
  description?: string;
  change?: number;
  changeLabel?: string;
  /** 
   * How to display the change value:
   * - 'percentage': Show as percentage (e.g., "+12.5%") - default
   * - 'points': Show as absolute points (e.g., "+0.3 pts") - for rates/percentages
   */
  changeType?: 'percentage' | 'points';
  chartData: { value: number }[];
  showMenu?: boolean;
  className?: string;
  /** Delay for stagger animation (in seconds) */
  animationDelay?: number;
}

export const MetricCardWithChart = React.memo(function MetricCardWithChart({
  title,
  subtitle,
  description,
  change,
  changeLabel = "vs last month",
  changeType = "percentage",
  chartData,
  showMenu = false,
  className,
  animationDelay = 0,
}: MetricCardWithChartProps) {
  const id = useId();
  const prefersReducedMotion = useReducedMotion();
  const isPositive = change !== undefined && change >= 0;

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        ...springs.smooth,
        delay: animationDelay,
      }
    },
  }), [animationDelay]);

  const reducedVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0, delay: animationDelay } },
  }), [animationDelay]);

  const strokeColor = isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))";

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
        <h3 className="text-sm font-semibold text-foreground">{subtitle}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Inner card with metric, trend, chart */}
      <div className="relative flex flex-col gap-4 rounded-t-xl bg-card px-4 py-5 shadow-sm border-t border-border md:gap-5 md:px-5">
        {/* Metric Value + Trend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <p className="text-3xl font-semibold tracking-tight text-foreground">{title}</p>
            {change !== undefined && (
              <motion.div 
                className="flex flex-col gap-0.5"
                initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: animationDelay + 0.2, ...springs.smooth }}
              >
                <div className={cn(
                  "flex items-center gap-0.5",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? (
                    <TrendUp01 className="h-4 w-4" />
                  ) : (
                    <TrendDown01 className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {changeType === 'points' 
                      ? `${Math.abs(change).toFixed(1)} pts`
                      : `${Math.abs(change).toFixed(1)}%`
                    }
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={56}>
          <AreaChart
            data={chartData}
            margin={{ left: 0, right: 0, top: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.5} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <Area
              isAnimationActive={!prefersReducedMotion}
              animationDuration={800}
              animationEasing="ease-out"
              dataKey="value"
              type="monotone"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#gradient-${id})`}
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* 3-dot Menu */}
        {showMenu && (
          <div className="absolute top-4 right-4 md:top-5 md:right-5">
            <button className="p-1 rounded-md hover:bg-muted transition-colors">
              <DotsVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});
