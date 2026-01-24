/**
 * Pricing Page
 * 
 * Displays available subscription plans for selection and checkout.
 * 
 * @page
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard01, ArrowLeft } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PricingCard, type PricingPlan } from '@/components/pricing/PricingCard';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';


/**
 * Fetch active plans from database.
 */
async function fetchPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select(`
      id,
      name,
      price_monthly,
      price_yearly,
      stripe_price_id_monthly,
      stripe_price_id_yearly,
      features,
      limits,
      active
    `)
    .eq('active', true)
    .order('price_monthly', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(plan => ({
    id: plan.id,
    name: plan.name,
    price_monthly: plan.price_monthly,
    price_yearly: plan.price_yearly,
    stripe_price_id_monthly: plan.stripe_price_id_monthly,
    stripe_price_id_yearly: plan.stripe_price_id_yearly,
    features: (plan.features as Record<string, boolean>) || {},
    limits: (plan.limits as Record<string, number>) || {},
    is_active: plan.active ?? true,
  }));
}

/**
 * Pricing page component.
 */
export function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const { 
    planId: currentPlanId, 
    openCheckout, 
    checkoutLoading 
  } = useSubscription();

  // Configure top bar
  const topBarConfig = useMemo(() => ({
    left: (
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </Button>
        <TopBarPageContext icon={CreditCard01} title="Choose Your Plan" />
      </div>
    ),
  }), [navigate]);
  useTopBar(topBarConfig);

  // Fetch plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSelectPlan = (priceId: string) => {
    if (!user) {
      // Redirect to login with return URL
      navigate('/login?redirect=/pricing');
      return;
    }
    openCheckout(priceId);
  };

  if (isLoading) {
    return (
      <div className="flex-1 h-full bg-muted/30 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[500px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 h-full bg-muted/30 p-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-semibold mb-2">Unable to load plans</h1>
          <p className="text-muted-foreground mb-4">
            Please try again later or contact support.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-muted/30 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">
            Choose the perfect plan for your needs
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Unlock powerful AI features to grow your business
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label 
              htmlFor="billing-toggle" 
              className={billingPeriod === 'monthly' ? 'font-medium' : 'text-muted-foreground'}
            >
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <Label 
              htmlFor="billing-toggle" 
              className={billingPeriod === 'yearly' ? 'font-medium' : 'text-muted-foreground'}
            >
              Yearly
              <span className="ml-2 text-xs text-status-active">(Save up to 20%)</span>
            </Label>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans?.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              isCurrentPlan={plan.id === currentPlanId}
              onSelect={handleSelectPlan}
              loading={checkoutLoading}
            />
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Need a custom plan?{' '}
            <a href="mailto:support@getpilot.com" className="text-primary hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
