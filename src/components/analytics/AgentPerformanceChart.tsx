/**
 * AgentPerformanceChart Component
 * 
 * Performance metrics display for single-agent (Ari) model.
 * Shows conversations, response time, and satisfaction score.
 * @module components/analytics/AgentPerformanceChart
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageChatSquare, Clock, Star01 } from '@untitledui/icons';

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  total_conversations: number;
  avg_response_time: number;
  satisfaction_score: number;
}

interface AgentPerformanceChartProps {
  data: AgentPerformance[];
}

const formatResponseTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

export const AgentPerformanceChart = ({ data }: AgentPerformanceChartProps) => {
  // Single agent model: use first agent or show empty state
  const agent = data[0];

  if (!agent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ari Performance</CardTitle>
          <CardDescription>AI assistant performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Conversations',
      value: agent.total_conversations.toLocaleString(),
      icon: MessageChatSquare,
      description: 'Total handled this period',
    },
    {
      label: 'Avg Response Time',
      value: formatResponseTime(agent.avg_response_time),
      icon: Clock,
      description: 'Time to first response',
    },
    {
      label: 'Satisfaction',
      value: agent.satisfaction_score > 0 ? `${agent.satisfaction_score}/5` : 'N/A',
      icon: Star01,
      description: agent.satisfaction_score > 0 ? 'Average rating' : 'No ratings yet',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ari Performance</CardTitle>
        <CardDescription>AI assistant performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 h-[300px] items-center">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div 
                key={metric.label}
                className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-muted/50"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <Icon size={24} className="text-primary" />
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-sm font-medium text-foreground mt-1">{metric.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{metric.description}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
