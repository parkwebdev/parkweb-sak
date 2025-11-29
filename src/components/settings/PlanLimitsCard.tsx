import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';

export const PlanLimitsCard = () => {
  const { limits, usage, loading, planName } = usePlanLimits();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!limits || !usage) return null;

  const limitItems = [
    {
      label: 'Agents',
      current: usage.agents,
      limit: limits.max_agents,
    },
    {
      label: 'Conversations (this month)',
      current: usage.conversations_this_month,
      limit: limits.max_conversations_per_month,
    },
    {
      label: 'API Calls (this month)',
      current: usage.api_calls_this_month,
      limit: limits.max_api_calls_per_month,
    },
    {
      label: 'Knowledge Sources',
      current: usage.knowledge_sources,
      limit: limits.max_knowledge_sources,
    },
    {
      label: 'Team Members',
      current: usage.team_members,
      limit: limits.max_team_members,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Usage</CardTitle>
        <CardDescription>
          Current plan: <span className="font-semibold text-foreground">{planName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {limitItems.map((item) => {
          const percentage = (item.current / item.limit) * 100;
          const isNearLimit = percentage >= 80;
          const isAtLimit = percentage >= 100;

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'}`}>
                  {item.current.toLocaleString()} / {item.limit.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={Math.min(percentage, 100)} 
                className={isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}
              />
            </div>
          );
        })}

        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/settings?tab=billing')}
          >
            Upgrade Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
