import { useId } from "react";
import { TrendUp01, TrendDown01, DotsVertical } from "@untitledui/icons";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface MetricCardWithChartProps {
  title: string;
  subtitle: string;
  change?: number;
  changeLabel?: string;
  chartData: { value: number }[];
  showMenu?: boolean;
  className?: string;
}

export function MetricCardWithChart({
  title,
  subtitle,
  change,
  changeLabel = "vs last month",
  chartData,
  showMenu = false,
  className,
}: MetricCardWithChartProps) {
  const id = useId();
  const isPositive = change !== undefined && change >= 0;
  const chartColor = isPositive ? "text-success" : "text-destructive";

  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-xl bg-muted/50 shadow-sm ring-1 ring-border/50 ring-inset",
      className
    )}>
      {/* Subtitle in outer wrapper */}
      <div className="mb-0.5 px-4 pt-3 pb-2 md:px-5">
        <h3 className="text-sm font-semibold text-foreground">{subtitle}</h3>
      </div>

      {/* Inner card with metric, trend, chart */}
      <div className="relative flex flex-col gap-4 rounded-xl bg-card px-4 py-5 shadow-sm ring-1 ring-border/50 ring-inset md:gap-5 md:px-5">
        {/* Metric Value + Trend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <p className="text-3xl font-semibold tracking-tight text-foreground">{title}</p>
            {change !== undefined && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-0.5",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? (
                    <TrendUp01 className="h-4 w-4" />
                  ) : (
                    <TrendDown01 className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer height={56}>
          <AreaChart
            data={chartData}
            margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />
                <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              isAnimationActive={false}
              className={chartColor}
              dataKey="value"
              type="monotone"
              stroke="currentColor"
              strokeWidth={2}
              fill={`url(#gradient-${id})`}
              fillOpacity={0.2}
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
    </div>
  );
}
