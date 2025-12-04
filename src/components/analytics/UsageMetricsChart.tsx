import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface UsageMetricsChartProps {
  data: Array<{
    date: string;
    conversations: number;
    messages: number;
    api_calls: number;
  }>;
}

const chartConfig = {
  conversations: {
    label: "Conversations",
    color: "hsl(var(--chart-1))",
  },
  messages: {
    label: "Messages",
    color: "hsl(var(--chart-2))",
  },
  api_calls: {
    label: "API Calls",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export const UsageMetricsChart = ({ data }: UsageMetricsChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Trends</CardTitle>
        <CardDescription>Monitor platform usage over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data}>
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
            <Line 
              type="monotone" 
              dataKey="conversations" 
              stroke="var(--color-conversations)"
              strokeWidth={2.5}
              dot={{ fill: "var(--color-conversations)", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="messages" 
              stroke="var(--color-messages)"
              strokeWidth={2.5}
              dot={{ fill: "var(--color-messages)", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="api_calls" 
              stroke="var(--color-api_calls)"
              strokeWidth={2.5}
              dot={{ fill: "var(--color-api_calls)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};