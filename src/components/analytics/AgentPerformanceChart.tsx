/**
 * AgentPerformanceChart Component
 * 
 * Bar chart displaying agent performance metrics.
 * Shows conversations, response time, and satisfaction by agent.
 * @module components/analytics/AgentPerformanceChart
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface AgentPerformanceChartProps {
  data: Array<{
    agent_id: string;
    agent_name: string;
    total_conversations: number;
    avg_response_time: number;
    satisfaction_score: number;
  }>;
}

const chartConfig = {
  total_conversations: {
    label: "Conversations",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export const AgentPerformanceChart = ({ data }: AgentPerformanceChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <CardDescription>Compare agent metrics and efficiency</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="agent_name" 
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
            <Bar 
              dataKey="total_conversations" 
              fill="var(--color-total_conversations)"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};