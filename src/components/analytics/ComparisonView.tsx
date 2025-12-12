/**
 * ComparisonView Component
 * 
 * Side-by-side comparison of metrics between two time periods.
 * Shows percentage change and trend indicators.
 * @module components/analytics/ComparisonView
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus } from '@untitledui/icons';
import { format } from 'date-fns';

interface ComparisonMetric {
  label: string;
  currentValue: number;
  previousValue: number;
  format?: 'number' | 'percentage' | 'currency';
}

interface ComparisonViewProps {
  currentPeriod: { start: Date; end: Date };
  previousPeriod: { start: Date; end: Date };
  metrics: ComparisonMetric[];
}

export const ComparisonView = ({ currentPeriod, previousPeriod, metrics }: ComparisonViewProps) => {
  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isIncrease: false, isDecrease: false };
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage),
      isIncrease: percentage > 0,
      isDecrease: percentage < 0,
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Period</CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(currentPeriod.start, 'MMM d, yyyy')} - {format(currentPeriod.end, 'MMM d, yyyy')}
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Previous Period</CardTitle>
            <p className="text-xs text-muted-foreground">
              {format(previousPeriod.start, 'MMM d, yyyy')} - {format(previousPeriod.end, 'MMM d, yyyy')}
            </p>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const change = calculateChange(metric.currentValue, metric.previousValue);
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {formatValue(metric.currentValue, metric.format)}
                    </span>
                    {change.isIncrease || change.isDecrease ? (
                      <Badge
                        variant="outline"
                        className={
                          change.isIncrease
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }
                      >
                        {change.isIncrease ? (
                          <ArrowUp className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDown className="h-3 w-3 mr-1" />
                        )}
                        {change.percentage.toFixed(1)}%
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        <Minus className="h-3 w-3 mr-1" />
                        0%
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    vs {formatValue(metric.previousValue, metric.format)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
