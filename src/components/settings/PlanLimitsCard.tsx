/**
 * @fileoverview Plan limits card showing usage vs limits and features for current plan.
 * Displays progress bars with warning colors near limits plus feature status.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePlanLimits, type PlanFeatures } from '@/hooks/usePlanLimits';
import { useCanManage } from '@/hooks/useCanManage';
import { useNavigate } from 'react-router-dom';
import { Check, X } from '@untitledui/icons';

export const PlanLimitsCard = () => {
  const { limits, usage, features, loading, planName, hasActiveSubscription } = usePlanLimits();
  const navigate = useNavigate();
  
  const canViewBilling = useCanManage('view_billing');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Plan Usage</CardTitle>
          <CardDescription className="text-sm">
            No active subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canViewBilling && (
            <Button 
              className="w-full"
              onClick={() => navigate('/settings?tab=billing')}
            >
              Subscribe Now
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!limits || !usage) return null;

  const limitItems = [
    {
      label: 'Conversations (this month)',
      current: usage.conversations_this_month,
      limit: limits.max_conversations_per_month,
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

  const featureItems: { key: keyof PlanFeatures; label: string; category: string }[] = [
    // Core
    { key: 'widget', label: 'Chat Widget', category: 'Core' },
    { key: 'webhooks', label: 'Webhooks', category: 'Core' },
    // Tools
    { key: 'custom_tools', label: 'Custom Tools', category: 'Tools' },
    { key: 'integrations', label: 'Integrations', category: 'Tools' },
    // Knowledge & Locations
    { key: 'knowledge_sources', label: 'Knowledge Sources', category: 'Knowledge' },
    { key: 'locations', label: 'Locations', category: 'Knowledge' },
    { key: 'calendar_booking', label: 'Calendar Booking', category: 'Knowledge' },
    // Analytics & Reporting
    { key: 'advanced_analytics', label: 'Advanced Analytics', category: 'Analytics' },
    { key: 'report_builder', label: 'Report Builder', category: 'Analytics' },
    { key: 'scheduled_reports', label: 'Scheduled Reports', category: 'Analytics' },
  ];

  const featureCategories = ['Core', 'Tools', 'Knowledge', 'Analytics'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Plan Usage</CardTitle>
        <CardDescription className="text-sm">
          Current plan: <span className="font-semibold text-foreground">{planName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Limits */}
        {limitItems.map((item) => {
          const limit = item.limit;
          const isUnlimited = limit === undefined || limit === null;
          const percentage = isUnlimited ? 0 : (item.current / limit) * 100;
          const isNearLimit = !isUnlimited && percentage >= 80;
          const isAtLimit = !isUnlimited && percentage >= 100;

          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-warning' : 'text-foreground'}`}>
                  {item.current.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
                </span>
              </div>
              <Progress 
                value={isUnlimited ? 0 : Math.min(percentage, 100)} 
                variant={isAtLimit ? 'destructive' : isNearLimit ? 'warning' : 'success'}
              />
            </div>
          );
        })}

        {/* Features Section */}
        {features && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Features</h4>
              {featureCategories.map((category) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{category}</h5>
                  <div className="grid grid-cols-1 gap-1.5">
                    {featureItems
                      .filter((item) => item.category === category)
                      .map((item) => {
                        const isEnabled = features[item.key] === true;
                        return (
                          <div key={item.key} className="flex items-center justify-between py-0.5">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <Badge 
                              variant={isEnabled ? 'default' : 'secondary'} 
                              size="sm"
                              className="gap-1"
                            >
                              {isEnabled ? (
                                <>
                                  <Check size={12} aria-hidden="true" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <X size={12} aria-hidden="true" />
                                  Disabled
                                </>
                              )}
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {canViewBilling && (
          <div className="pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/settings?tab=billing')}
            >
              Upgrade Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
