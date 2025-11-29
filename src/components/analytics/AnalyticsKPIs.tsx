import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendUp01, TrendDown01 } from '@untitledui/icons';

interface KPI {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
}

interface AnalyticsKPIsProps {
  kpis: KPI[];
}

export const AnalyticsKPIs = ({ kpis }: AnalyticsKPIsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{kpi.value}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {kpi.change >= 0 ? (
                <TrendUp01 className="h-3 w-3 text-success" />
              ) : (
                <TrendDown01 className="h-3 w-3 text-destructive" />
              )}
              <span className={kpi.change >= 0 ? 'text-success' : 'text-destructive'}>
                {Math.abs(kpi.change)}%
              </span>
              <span>{kpi.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
