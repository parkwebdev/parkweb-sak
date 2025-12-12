/**
 * ConversationChart Component
 * 
 * Line chart showing conversation trends over time.
 * Displays total, active, and closed conversation counts.
 * @module components/analytics/ConversationChart
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ConversationChartProps {
  data: Array<{
    date: string;
    total: number;
    active: number;
    closed: number;
  }>;
}

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  active: {
    label: "Active",
    color: "hsl(var(--chart-2))",
  },
  closed: {
    label: "Closed",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export const ConversationChart = ({ data }: ConversationChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Volume</CardTitle>
        <CardDescription>Track conversation trends over time</CardDescription>
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
              dataKey="total" 
              stroke="var(--color-total)"
              strokeWidth={2.5}
              dot={{ fill: "var(--color-total)", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="active" 
              stroke="var(--color-active)"
              strokeWidth={2.5}
              dot={{ fill: "var(--color-active)", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="closed" 
              stroke="var(--color-closed)"
              strokeWidth={2.5}
              dot={{ fill: "var(--color-closed)", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};