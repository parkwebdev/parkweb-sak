import { TrendUp01, TrendDown01, DotsVertical } from "@untitledui/icons";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
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
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden border-border/50 bg-card hover:border-border transition-colors",
      className
    )}>
      {/* Header: Subtitle + Menu */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <span className="text-sm font-medium text-muted-foreground">{subtitle}</span>
        {showMenu && (
          <button className="p-1 rounded-md hover:bg-muted transition-colors">
            <DotsVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Metric Value + Trend */}
      <div className="flex items-baseline gap-3 px-5 pb-4">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{title}</span>
        {change !== undefined && (
          <div className="flex items-center gap-1.5">
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
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </div>

      {/* Full-width Chart */}
      <div className="h-16 w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
