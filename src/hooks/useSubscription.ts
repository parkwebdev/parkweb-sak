/**
 * useSubscription Hook
 * 
 * Centralized subscription state management.
 * Checks subscription status from Stripe, provides checkout and portal helpers.
 * 
 * @module hooks/useSubscription
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';

export interface SubscriptionState {
  loading: boolean;
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  planName: string | null;
  planId: string | null;
  subscriptionEnd: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
}

interface UseSubscriptionResult extends SubscriptionState {
  /** Re-check subscription status from Stripe */
  checkSubscription: () => Promise<void>;
  /** Open Stripe Checkout for a specific price */
  openCheckout: (priceId: string, options?: CheckoutOptions) => Promise<void>;
  /** Open Stripe Customer Portal for subscription management */
  openCustomerPortal: () => Promise<void>;
  /** Cancel subscription at period end */
  cancelSubscription: () => Promise<void>;
  /** Reactivate a subscription scheduled for cancellation */
  reactivateSubscription: () => Promise<void>;
  /** Whether checkout is in progress */
  checkoutLoading: boolean;
  /** The specific priceId currently being processed for checkout */
  checkoutLoadingPriceId: string | null;
  /** Whether portal redirect is in progress */
  portalLoading: boolean;
  /** Whether cancel is in progress */
  cancelLoading: boolean;
  /** Whether reactivate is in progress */
  reactivateLoading: boolean;
}

interface CheckoutOptions {
  successUrl?: string;
  cancelUrl?: string;
}

const INITIAL_STATE: SubscriptionState = {
  loading: true,
  subscribed: false,
  productId: null,
  priceId: null,
  planName: null,
  planId: null,
  subscriptionEnd: null,
  status: null,
  cancelAtPeriodEnd: false,
  cancelAt: null,
};

// Check subscription every 60 seconds
const REFRESH_INTERVAL = 60 * 1000;

/**
 * Hook for managing subscription state and Stripe interactions.
 */
export function useSubscription(): UseSubscriptionResult {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>(INITIAL_STATE);
  const [checkoutLoadingPriceId, setCheckoutLoadingPriceId] = useState<string | null>(null);
  const checkoutLoading = checkoutLoadingPriceId !== null;
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);

  /**
   * Check subscription status from Stripe.
   */
  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('[useSubscription] Error checking subscription:', error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      if (data.error) {
        console.error('[useSubscription] API error:', data.error);
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      setState({
        loading: false,
        subscribed: data.subscribed ?? false,
        productId: data.product_id ?? null,
        priceId: data.price_id ?? null,
        planName: data.plan_name ?? null,
        planId: data.plan_id ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        status: data.status ?? null,
        cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
        cancelAt: data.cancel_at ?? null,
      });
    } catch (error: unknown) {
      console.error('[useSubscription] Failed to check subscription:', getErrorMessage(error));
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user, session]);

  /**
   * Open Stripe Checkout for a specific price.
   */
  const openCheckout = useCallback(async (priceId: string, options?: CheckoutOptions) => {
    if (!user || !session) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setCheckoutLoadingPriceId(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          price_id: priceId,
          success_url: options?.successUrl,
          cancel_url: options?.cancelUrl,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: unknown) {
      toast.error('Failed to start checkout', {
        description: getErrorMessage(error),
      });
    } finally {
      setCheckoutLoadingPriceId(null);
    }
  }, [user, session]);

  /**
   * Open Stripe Customer Portal.
   */
  const openCustomerPortal = useCallback(async () => {
    if (!user || !session) {
      toast.error('Please sign in to manage your subscription');
      return;
    }

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        // Open portal in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: unknown) {
      toast.error('Failed to open subscription portal', {
        description: getErrorMessage(error),
      });
    } finally {
      setPortalLoading(false);
    }
  }, [user, session]);

  /**
   * Cancel subscription at period end.
   */
  const cancelSubscription = useCallback(async () => {
    if (!user || !session) {
      toast.error('Please sign in to cancel your subscription');
      return;
    }

    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Subscription canceled', {
        description: 'Your subscription will end at the current billing period.',
      });
      
      // Refresh subscription state
      await checkSubscription();
    } catch (error: unknown) {
      toast.error('Failed to cancel subscription', {
        description: getErrorMessage(error),
      });
    } finally {
      setCancelLoading(false);
    }
  }, [user, session, checkSubscription]);

  /**
   * Reactivate a subscription scheduled for cancellation.
   */
  const reactivateSubscription = useCallback(async () => {
    if (!user || !session) {
      toast.error('Please sign in to reactivate your subscription');
      return;
    }

    setReactivateLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-subscription');

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success('Subscription reactivated', {
        description: 'Your subscription will continue as normal.',
      });
      
      // Refresh subscription state
      await checkSubscription();
    } catch (error: unknown) {
      toast.error('Failed to reactivate subscription', {
        description: getErrorMessage(error),
      });
    } finally {
      setReactivateLoading(false);
    }
  }, [user, session, checkSubscription]);

  // Check subscription on mount and when user changes
  useEffect(() => {
    if (user && session) {
      checkSubscription();
    } else {
      setState(INITIAL_STATE);
    }
  }, [user, session, checkSubscription]);

  // Auto-refresh subscription status periodically
  useEffect(() => {
    if (!user || !session) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [user, session, checkSubscription]);

  // Check for checkout success/cancel in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');

    if (checkoutStatus === 'success') {
      toast.success('Subscription activated!', {
        description: 'Thank you for subscribing. Your features are now unlocked.',
      });
      // Re-check subscription after successful checkout
      checkSubscription();
      // Clean up URL
      params.delete('checkout');
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    } else if (checkoutStatus === 'canceled') {
      toast.info('Checkout canceled', {
        description: 'No charges were made.',
      });
      // Clean up URL
      params.delete('checkout');
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [checkSubscription]);

  return useMemo(() => ({
    ...state,
    checkSubscription,
    openCheckout,
    openCustomerPortal,
    cancelSubscription,
    reactivateSubscription,
    checkoutLoading,
    checkoutLoadingPriceId,
    portalLoading,
    cancelLoading,
    reactivateLoading,
  }), [state, checkSubscription, openCheckout, openCustomerPortal, cancelSubscription, reactivateSubscription, checkoutLoading, checkoutLoadingPriceId, portalLoading, cancelLoading, reactivateLoading]);
}

export default useSubscription;
