/**
 * Admin Stripe Sync Edge Function
 * 
 * Synchronizes Stripe products/prices with local plans table
 * and fetches revenue metrics for the admin dashboard.
 * 
 * @module functions/admin-stripe-sync
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.5.0";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/errors.ts";

/** Valid action types for this function */
type ActionType = 'sync_products' | 'get_revenue_metrics';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check super_admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (roleData?.role !== 'super_admin') {
      throw new Error('Unauthorized: Super admin access required');
    }

    // Check for Stripe secret key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY secret.');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const body = await req.json();
    const { action } = body as { action: ActionType };

    if (action === 'sync_products') {
      console.log('Starting Stripe product sync...');
      
      // Fetch products from Stripe
      const products = await stripe.products.list({ active: true, limit: 100 });
      const prices = await stripe.prices.list({ active: true, limit: 100 });

      console.log(`Found ${products.data.length} products and ${prices.data.length} prices`);

      let synced = 0;
      const errors: string[] = [];

      // Sync to local plans table
      for (const product of products.data) {
        try {
          const productPrices = prices.data.filter(p => p.product === product.id);
          const monthlyPrice = productPrices.find(p => p.recurring?.interval === 'month');
          const yearlyPrice = productPrices.find(p => p.recurring?.interval === 'year');

          // Parse features and limits from metadata
          let features = {};
          let limits = {};
          
          try {
            if (product.metadata.features) {
              features = JSON.parse(product.metadata.features);
            }
          } catch {
            console.warn(`Invalid features JSON for product ${product.id}`);
          }
          
          try {
            if (product.metadata.limits) {
              limits = JSON.parse(product.metadata.limits);
            }
          } catch {
            console.warn(`Invalid limits JSON for product ${product.id}`);
          }

          const { error: upsertError } = await supabase
            .from('plans')
            .upsert({
              id: product.id,
              name: product.name,
              price_monthly: (monthlyPrice?.unit_amount || 0) / 100, // Convert cents to dollars
              price_yearly: (yearlyPrice?.unit_amount || 0) / 100,
              features,
              limits,
              active: product.active,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

          if (upsertError) {
            errors.push(`Failed to sync ${product.name}: ${upsertError.message}`);
          } else {
            synced++;
          }
        } catch (productError: unknown) {
          errors.push(`Error processing ${product.name}: ${getErrorMessage(productError)}`);
        }
      }

      // Log audit action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'stripe.sync_products',
        target_type: 'plans',
        details: { 
          products_found: products.data.length,
          prices_found: prices.data.length,
          synced,
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      console.log(`Stripe sync complete: ${synced} products synced, ${errors.length} errors`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced,
          total: products.data.length,
          errors: errors.length > 0 ? errors : undefined,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_revenue_metrics') {
      console.log('Fetching Stripe revenue metrics...');

      // Get current subscriptions
      const subscriptions = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        expand: ['data.items.data.price'],
      });

      // Calculate metrics
      const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active');
      const trialingSubscriptions = subscriptions.data.filter(s => s.status === 'trialing');
      
      // Calculate MRR from active subscriptions
      let mrr = 0;
      for (const sub of activeSubscriptions) {
        const item = sub.items.data[0];
        if (!item?.price) continue;
        
        const amount = item.price.unit_amount || 0;
        const interval = item.price.recurring?.interval;
        
        if (interval === 'month') {
          mrr += amount;
        } else if (interval === 'year') {
          mrr += Math.round(amount / 12);
        }
      }
      mrr = mrr / 100; // Convert from cents

      // Calculate churn (canceled in last 30 days)
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
      const canceledRecently = subscriptions.data.filter(s => 
        s.status === 'canceled' && 
        s.canceled_at && 
        s.canceled_at > thirtyDaysAgo
      );
      
      const totalAtPeriodStart = activeSubscriptions.length + canceledRecently.length;
      const churnRate = totalAtPeriodStart > 0 
        ? (canceledRecently.length / totalAtPeriodStart) * 100 
        : 0;

      // Calculate ARPU (Average Revenue Per User)
      const arpu = activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0;

      // Estimate LTV (Lifetime Value) = ARPU / Churn Rate (monthly)
      const monthlyChurnDecimal = churnRate / 100;
      const ltv = monthlyChurnDecimal > 0 ? arpu / monthlyChurnDecimal : arpu * 24; // Default to 24 months if no churn

      // Trial conversion rate (simplified)
      const convertedTrials = subscriptions.data.filter(s => 
        s.status === 'active' && 
        s.trial_end && 
        s.trial_end < Math.floor(Date.now() / 1000)
      ).length;
      const totalWithTrials = subscriptions.data.filter(s => s.trial_end).length;
      const trialConversion = totalWithTrials > 0 
        ? (convertedTrials / totalWithTrials) * 100 
        : 0;

      const metrics = {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        activeSubscriptions: activeSubscriptions.length,
        trialCount: trialingSubscriptions.length,
        churnRate: Math.round(churnRate * 100) / 100,
        arpu: Math.round(arpu * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        trialConversion: Math.round(trialConversion * 100) / 100,
        netRevenueRetention: 100 - churnRate, // Simplified NRR
        canceledThisMonth: canceledRecently.length,
      };

      console.log('Revenue metrics calculated:', metrics);

      return new Response(
        JSON.stringify(metrics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action. Must be "sync_products" or "get_revenue_metrics"');
  } catch (error: unknown) {
    console.error('Admin Stripe sync error:', error);
    
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
