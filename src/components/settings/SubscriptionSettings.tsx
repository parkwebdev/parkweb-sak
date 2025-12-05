import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate } from '@/lib/formatting';
import { CheckCircle, Download01, LinkExternal01, RefreshCw01, Receipt } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/lib/toast';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';
import { LoadingState } from '@/components/ui/loading-state';
import { Spinner } from '@/components/ui/spinner';

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
      } catch (error) {
        console.error('Error fetching subscription:', error);
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
      // Simply call the edge function - Supabase client handles auth automatically
      const { data, error } = await supabase.functions.invoke('get-invoices');

      if (error) throw error;
      if (data?.invoices) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load billing history');
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    // Use ref guard to prevent duplicate fetches from React Strict Mode / re-renders
    if (user && !hasFetchedInvoicesRef.current) {
      hasFetchedInvoicesRef.current = true;
      fetchInvoices();
    }
  }, [user]);

  if (loading) {
    return <LoadingState size="lg" className="py-16" />;
  }

  const plan = subscription?.plans;
  const features = plan?.features as any;
  const limits = plan?.limits as any;

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

  return (
    <div className="space-y-6">
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
                          <CheckCircle className="h-4 w-4 text-success shrink-0" />
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View and download your invoices
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInvoices}
              disabled={invoicesLoading}
            >
              {invoicesLoading ? <Spinner size="sm" className="mr-2" /> : <RefreshCw01 className="h-4 w-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <LoadingState size="md" />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-5 w-5 text-muted-foreground/50" />}
              title="No billing history available"
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice, index) => (
                    <AnimatedTableRow key={invoice.id} index={index}>
                      <TableCell className="font-medium">
                        {invoice.number || invoice.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>
                        {formatDate(new Date(invoice.date * 1000), {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.hostedUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(invoice.hostedUrl!, '_blank')}
                            >
                              <LinkExternal01 className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.pdfUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
