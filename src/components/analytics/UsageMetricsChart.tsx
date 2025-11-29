import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UsageMetricsChartProps {
  data: Array<{
    date: string;
    conversations: number;
    messages: number;
    api_calls: number;
  }>;
}

export const UsageMetricsChart = ({ data }: UsageMetricsChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Trends</CardTitle>
        <CardDescription>Monitor platform usage over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="conversations" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Conversations"
            />
            <Line 
              type="monotone" 
              dataKey="messages" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Messages"
            />
            <Line 
              type="monotone" 
              dataKey="api_calls" 
              stroke="#10b981" 
              strokeWidth={2}
              name="API Calls"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
