/**
 * @fileoverview Subscription and billing settings with invoice history.
 * Displays current plan, payment method, and billing history table.
 * Respects manage_billing permission for action buttons.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCanManage } from '@/hooks/useCanManage';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate } from '@/lib/formatting';
import { CheckCircle, Download01, LinkExternal01, RefreshCw01, Receipt, Zap, Calendar, CreditCard01, ArrowUpRight } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/lib/toast';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';
import { SkeletonSettingsCard, SkeletonTableRow, Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { logger } from '@/utils/logger';
import CreditCard from '@/components/shared-assets/credit-card/credit-card';

type Subscription = Tables<'subscriptions'> & {
  plans?: Tables<'plans'>;
};

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

export const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const hasFetchedInvoicesRef = useRef(false);
  
  // Check if user can manage billing (upgrade, update payment, etc.)
  const canManageBilling = useCanManage('manage_billing');

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, plans(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setSubscription(data);
      } catch (error: unknown) {
        logger.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  const fetchInvoices = async () => {
    if (!user) return;

    setInvoicesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-invoices');

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

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>
    );
  }

  const plan = subscription?.plans;

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

  // Calculate total spent this year from paid invoices
  const currentYear = new Date().getFullYear();
  const totalSpentThisYear = invoices
    .filter(inv => inv.status === 'paid' && new Date(inv.date * 1000).getFullYear() === currentYear)
    .reduce((sum, inv) => sum + inv.amount, 0);

  const cardholderName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Card Holder';

  return (
    <div className="space-y-8">
      {/* Hero Section: Plan + Payment Method */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <CardContent className="relative p-6">
            {subscription && plan ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Plan</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{plan.name}</h2>
                    <p className="text-muted-foreground mt-1">
                      <span className="text-xl font-semibold text-foreground">${(plan.price_monthly / 100).toFixed(2)}</span>
                      <span className="text-sm">/month</span>
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
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {subscription.status}
                    </span>
                  </Badge>
                </div>

                {subscription.current_period_end && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Renews{' '}
                      {formatDate(subscription.current_period_end, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {canManageBilling && (
                    <>
                      <Button variant="outline" size="sm">
                        <CreditCard01 className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </Button>
                      <Button size="sm">
                        Upgrade Plan
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No active subscription</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a plan to unlock all features
                </p>
                {canManageBilling && <Button>Choose a Plan</Button>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard01 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Method</span>
            </div>
            
            <div className="flex flex-col items-center">
              <CreditCard 
                type="gray-dark" 
                cardholderName={cardholderName}
              />
              {canManageBilling && (
                <Button variant="outline" size="sm" className="mt-4">
                  Update Payment Method
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Payment</p>
                <p className="text-sm font-semibold">
                  {subscription?.current_period_end
                    ? formatDate(subscription.current_period_end, { month: 'short', day: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing Cycle</p>
                <p className="text-sm font-semibold">Monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Spent This Year</p>
                <p className="text-sm font-semibold">
                  {invoices.length > 0 && totalSpentThisYear > 0
                    ? formatCurrency(totalSpentThisYear, invoices[0]?.currency || 'usd')
                    : '$0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Billing History</h3>
            <p className="text-xs text-muted-foreground">View and download your past invoices</p>
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
