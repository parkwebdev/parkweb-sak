import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowUpRight } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate } from '@/lib/formatting';
import { PlanLimitsCard } from './PlanLimitsCard';

type Subscription = Tables<'subscriptions'> & {
  plans?: Tables<'plans'>;
};

export const SubscriptionSettings = () => {
  const { currentOrg } = useOrganization();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentOrg) return;

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('org_id', currentOrg.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setSubscription(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [currentOrg]);

  if (loading) {
    return <div className="text-center py-8">Loading subscription...</div>;
  }

  const plan = subscription?.plans;
  const features = plan?.features as any;
  const limits = plan?.limits as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Subscription</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Plan Usage Limits */}
      <PlanLimitsCard />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </div>
            <Button>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription && plan ? (
            <>
              <div className="flex items-center justify-between p-6 border rounded-lg bg-accent/50">
                <div>
                  <h3 className="text-base font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${(plan.price_monthly / 100).toFixed(2)}/month
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    subscription.status === 'active'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {subscription.status}
                </Badge>
              </div>

              {subscription.current_period_end && (
                <div className="text-sm text-muted-foreground">
                  Renews on{' '}
                  {formatDate(subscription.current_period_end, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              )}

              {features && (
                <>
                  <div>
                    <h4 className="font-semibold mb-3">Plan Features</h4>
                    <div className="space-y-2">
                      {Object.entries(features).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {limits && (
                <>
                  <div>
                    <h4 className="font-semibold mb-3">Usage Limits</h4>
                    <div className="space-y-4">
                      {Object.entries(limits).map(([key, value]) => {
                        const isUnlimited = value === -1;
                        return (
                          <div key={key}>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="text-muted-foreground">
                                {isUnlimited ? 'Unlimited' : `0 / ${value}`}
                              </span>
                            </div>
                            {!isUnlimited && (
                              <Progress value={0} className="h-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active subscription</p>
              <Button>Choose a Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No billing history available
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
