/**
 * AgentPerformanceChart Component
 * 
 * Bar chart displaying agent performance metrics.
 * Shows conversations by agent.
 * @module components/analytics/AgentPerformanceChart
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent } from '@/components/charts/charts-base';
import { useBreakpoint } from '@/hooks/use-breakpoint';

interface AgentPerformanceChartProps {
  data: Array<{
    agent_id: string;
    agent_name: string;
    total_conversations: number;
    avg_response_time: number;
    satisfaction_score: number;
  }>;
}

export const AgentPerformanceChart = ({ data }: AgentPerformanceChartProps) => {
  const isDesktop = useBreakpoint('lg');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <CardDescription>Compare agent metrics and efficiency</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              className="text-muted-foreground [&_.recharts-text]:text-xs"
              margin={{
                top: isDesktop ? 12 : 6,
                bottom: isDesktop ? 16 : 0,
                left: 0,
                right: 0,
              }}
            >
              <CartesianGrid 
                vertical={false} 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.5}
              />

              <XAxis
                dataKey="agent_name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => Number(value).toLocaleString()}
              />

              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(value) => Number(value).toLocaleString()}
                cursor={{
                  fill: 'hsl(var(--muted))',
                  fillOpacity: 0.3,
                }}
              />

              <Bar
                dataKey="total_conversations"
                name="Conversations"
                fill="hsl(var(--primary))"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
