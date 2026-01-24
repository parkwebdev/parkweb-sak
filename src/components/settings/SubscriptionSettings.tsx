/**
 * @fileoverview Subscription and billing settings with inline plan selection.
 * Displays plan grid at top with billing history below.
 * Matches Time2book reference design.
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCanManage } from '@/hooks/useCanManage';
import { useSubscription } from '@/hooks/useSubscription';
import { formatDate } from '@/lib/formatting';
import { Download01, LinkExternal01, RefreshCw01, Receipt, CreditCard01 } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/lib/toast';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';
import { SkeletonSettingsCard, SkeletonTableRow } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { logger } from '@/utils/logger';
import { PlanCard, type PlanData } from '@/components/pricing/PlanCard';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { TooltipProvider } from '@/components/ui/tooltip';

type Invoice = {
  id: string;
  number: string | null;
  date: number;
  amount: number;
  currency: string;
  status: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
  periodStart: number | null;
  periodEnd: number | null;
};

/**
 * Fetch active plans from database.
 */
async function fetchPlans(): Promise<PlanData[]> {
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
  }));
}

export const SubscriptionSettings = () => {
  const { user, session } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const hasFetchedInvoicesRef = useRef(false);
  
  // Check if user can manage billing (upgrade, update payment, etc.)
  const canManageBilling = useCanManage('manage_billing');
  
  // Subscription actions from hook
  const { 
    planId: currentPlanId,
    openCheckout, 
    checkoutLoading,
    openCustomerPortal, 
    portalLoading 
  } = useSubscription();

  // Fetch plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000,
  });

  const fetchInvoices = async () => {
    if (!user || !session?.access_token) return;

    setInvoicesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-invoices', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.invoices) {
        setInvoices(data.invoices);
      }
    } catch (error: unknown) {
      logger.error('Error fetching invoices:', error);
      toast.error('Failed to load billing history');
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasFetchedInvoicesRef.current) {
      hasFetchedInvoicesRef.current = true;
      fetchInvoices();
    }
  }, [user]);

  const handleSelectPlan = (priceId: string) => {
    openCheckout(priceId);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'open':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'void':
        return 'bg-muted text-muted-foreground border-border';
      case 'uncollectible':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (plansLoading) {
    return (
      <div className="space-y-6">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Billing Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Plan & Billing</h2>
          <p className="text-sm text-muted-foreground">
            View and update your subscription
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BillingToggle 
            value={billingPeriod} 
            onChange={setBillingPeriod} 
          />
          {canManageBilling && currentPlanId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCustomerPortal()}
              disabled={portalLoading}
            >
              <CreditCard01 className="h-4 w-4 mr-2" />
              {portalLoading ? 'Loading...' : 'Manage'}
            </Button>
          )}
        </div>
      </div>

      {/* Plans Grid - adapts to number of plans */}
      <TooltipProvider>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${plans && plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} divide-y md:divide-y-0 md:divide-x divide-border border rounded-lg bg-card`}>
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              allPlans={plans}
              billingPeriod={billingPeriod}
              isCurrentPlan={plan.id === currentPlanId}
              onSelect={handleSelectPlan}
              loading={checkoutLoading}
              disabled={!canManageBilling}
            />
          ))}
        </div>
      </TooltipProvider>

      {/* Billing History */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Billing History</h3>
            <p className="text-sm text-muted-foreground">View and download your past invoices</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInvoices}
            disabled={invoicesLoading}
          >
            {invoicesLoading ? <Spinner size="sm" className="mr-2" /> : <RefreshCw01 className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="p-4 space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={5} />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Receipt className="h-5 w-5 text-muted-foreground/50" />}
                  title="No billing history"
                  description="Your invoices will appear here once you have an active subscription"
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice, index) => (
                    <AnimatedTableRow key={invoice.id} index={index} className="group">
                      <TableCell className="pl-6 font-medium">
                        {invoice.number || `INV-${invoice.id.substring(0, 8).toUpperCase()}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(new Date(invoice.date * 1000), {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(invoice.status)}
                        >
                          {invoice.status || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {invoice.hostedUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(invoice.hostedUrl!, '_blank')}
                            >
                              <LinkExternal01 className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(invoice.pdfUrl!, '_blank')}
                            >
                              <Download01 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </AnimatedTableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
