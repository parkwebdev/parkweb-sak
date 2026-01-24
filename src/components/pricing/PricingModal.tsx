/**
 * @fileoverview Full-screen pricing modal with Sheet-like styling.
 * Displays plan cards for subscription selection.
 */

import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XClose } from '@untitledui/icons';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { usePricingModal } from '@/contexts/PricingModalContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { PricingCard, type PricingPlan } from './PricingCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type BillingPeriod = 'monthly' | 'yearly';

async function fetchPlans(): Promise<PricingPlan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, price_monthly, price_yearly, features, limits, stripe_price_id_monthly, stripe_price_id_yearly, active')
    .eq('active', true)
    .order('price_monthly', { ascending: true });

  if (error) throw error;

  return (data || []).map(plan => ({
    id: plan.id,
    name: plan.name,
    price_monthly: plan.price_monthly,
    price_yearly: plan.price_yearly,
    features: (plan.features as Record<string, boolean>) || {},
    limits: (plan.limits as Record<string, number>) || {},
    stripe_price_id_monthly: plan.stripe_price_id_monthly,
    stripe_price_id_yearly: plan.stripe_price_id_yearly,
    is_active: plan.active ?? true,
  }));
}

export function PricingModal() {
  const { isOpen, closePricingModal } = usePricingModal();
  const { user } = useAuth();
  const { openCheckout, planId: currentPlanId, loading: subscriptionLoading } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [selectedPlanLoading, setSelectedPlanLoading] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans', 'active'],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectPlan = async (priceId: string) => {
    if (!user) {
      closePricingModal();
      // Navigate to login - handled by useSubscription
    }
    setSelectedPlanLoading(priceId);
    try {
      await openCheckout(priceId);
    } finally {
      setSelectedPlanLoading(null);
    }
  };

  // Find recommended plan (middle tier or explicitly marked)
  const recommendedPlanIndex = Math.min(1, plans.length - 1);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && closePricingModal()}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay 
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        
        {/* Modal Content */}
        <DialogPrimitive.Content
          className={cn(
            // Sheet-like positioning with margins
            "fixed inset-3 md:inset-6 lg:inset-10 z-50",
            "bg-background rounded-xl border shadow-2xl",
            "overflow-hidden flex flex-col",
            // Focus
            "outline-none",
            // Animations
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]",
            "duration-200"
          )}
        >
          {/* Visually hidden title for accessibility */}
          <DialogPrimitive.Title className="sr-only">
            Choose Your Plan
          </DialogPrimitive.Title>

          {/* Close Button */}
          <DialogPrimitive.Close 
            className={cn(
              "absolute right-4 top-4 z-10",
              "rounded-full p-2",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <XClose size={20} aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-8 md:px-10 md:py-12 lg:px-16 lg:py-16">
              {/* Header */}
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                  Choose Your Plan
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Select the plan that best fits your needs. Upgrade or downgrade anytime.
                </p>
              </div>

              {/* Billing Toggle */}
              <div className="flex justify-center mb-10">
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setBillingPeriod('monthly')}
                    className="rounded-md"
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setBillingPeriod('yearly')}
                    className="rounded-md"
                  >
                    Yearly
                    <span className="ml-1.5 text-xs font-medium text-success">Save 20%</span>
                  </Button>
                </div>
              </div>

              {/* Plans Grid */}
              {isLoading || subscriptionLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-4 p-6 border rounded-xl">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-10 w-32" />
                      <div className="space-y-2 pt-4">
                        {[1, 2, 3, 4].map((j) => (
                          <Skeleton key={j} className="h-4 w-full" />
                        ))}
                      </div>
                      <Skeleton className="h-10 w-full mt-4" />
                    </div>
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No plans available at the moment.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto items-start">
                  {plans.map((plan, index) => {
                    const priceId = billingPeriod === 'yearly' 
                      ? plan.stripe_price_id_yearly 
                      : plan.stripe_price_id_monthly;
                    return (
                      <PricingCard
                        key={plan.id}
                        plan={plan}
                        billingPeriod={billingPeriod}
                        isPopular={index === recommendedPlanIndex}
                        isCurrentPlan={plan.id === currentPlanId}
                        onSelect={handleSelectPlan}
                        loading={selectedPlanLoading === priceId}
                        disabled={selectedPlanLoading !== null}
                      />
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-12 text-sm text-muted-foreground">
                <p>All plans include a 14-day free trial. Cancel anytime.</p>
                <p className="mt-1">
                  Questions? <a href="/help" className="text-primary hover:underline">Contact our team</a>
                </p>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
