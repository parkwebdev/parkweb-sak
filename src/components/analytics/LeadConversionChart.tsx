import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface LeadConversionChartProps {
  data: Array<{
    date: string;
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
  }>;
}

const chartConfig = {
  new: {
    label: "New",
    color: "hsl(var(--chart-1))",
  },
  contacted: {
    label: "Contacted",
    color: "hsl(var(--chart-2))",
  },
  qualified: {
    label: "Qualified",
    color: "hsl(var(--chart-3))",
  },
  converted: {
    label: "Converted",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export const LeadConversionChart = ({ data }: LeadConversionChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Conversion Funnel</CardTitle>
        <CardDescription>Track leads through the conversion pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-new)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-new)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="fillContacted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-contacted)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-contacted)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="fillQualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-qualified)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-qualified)" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="fillConverted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-converted)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-converted)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="new" 
                stackId="1"
                stroke="var(--color-new)"
                fill="url(#fillNew)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="contacted" 
                stackId="1"
                stroke="var(--color-contacted)"
                fill="url(#fillContacted)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="qualified" 
                stackId="1"
                stroke="var(--color-qualified)"
                fill="url(#fillQualified)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="converted" 
                stackId="1"
                stroke="var(--color-converted)"
                fill="url(#fillConverted)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};