import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ConversationChartProps {
  data: Array<{
    date: string;
    total: number;
    active: number;
    closed: number;
  }>;
}

export const ConversationChart = ({ data }: ConversationChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Volume</CardTitle>
        <CardDescription>Track conversation trends over time</CardDescription>
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
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Total"
            />
            <Line 
              type="monotone" 
              dataKey="active" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Active"
            />
            <Line 
              type="monotone" 
              dataKey="closed" 
              stroke="#6b7280" 
              strokeWidth={2}
              name="Closed"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
