import { ArrowUp, ArrowDown } from "@untitledui/icons";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardWithChartProps {
  title: string;
  subtitle: string;
  change?: number;
  changeLabel?: string;
  chartData: { value: number }[];
  className?: string;
}

export function MetricCardWithChart({
  title,
  subtitle,
  change,
  changeLabel = "vs last month",
  chartData,
  className,
}: MetricCardWithChartProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className={cn("flex flex-1 items-center justify-between gap-4 p-5", className)}>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
        {change !== undefined && (
          <div className="mt-1 flex items-center gap-1">
            {isPositive ? (
              <ArrowUp className="h-3.5 w-3.5 text-success" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 text-destructive" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                isPositive ? "text-success" : "text-destructive"
              )}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </div>

      <div className="h-12 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
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
