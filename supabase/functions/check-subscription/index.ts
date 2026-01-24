/**
 * Check Subscription Edge Function
 * 
 * Verifies user's subscription status directly from Stripe (source of truth).
 * Called on login, page load, and periodically to sync subscription state.
 * 
 * @module functions/check-subscription
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Helper logging function for debugging.
 */
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify Stripe key is available
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    logStep("Stripe key verified");

    // Initialize Supabase client with service role for database updates
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer in Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning unsubscribed state");
      return new Response(
        JSON.stringify({
          subscribed: false,
          product_id: null,
          price_id: null,
          plan_name: null,
          subscription_end: null,
          status: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check for trialing subscriptions
    let subscription = subscriptions.data[0];
    if (!subscription) {
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });
      subscription = trialingSubscriptions.data[0];
    }

    if (!subscription) {
      logStep("No active/trialing subscription found");
      
      // Update local subscription record to inactive
      await supabaseClient
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("user_id", user.id)
        .eq("status", "active");
      
      return new Response(
        JSON.stringify({
          subscribed: false,
          product_id: null,
          price_id: null,
          plan_name: null,
          subscription_end: null,
          status: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Extract subscription details
    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem.price.id;
    const productId = subscriptionItem.price.product as string;
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const status = subscription.status;
    const cancelAtPeriodEnd = subscription.cancel_at_period_end;
    const cancelAt = subscription.cancel_at 
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : null;
    
    logStep("Active subscription found", {
      subscriptionId: subscription.id,
      productId,
      priceId,
      status,
      endDate: subscriptionEnd,
      cancelAtPeriodEnd,
      cancelAt,
    });

    // Get product name from Stripe
    const product = await stripe.products.retrieve(productId);
    const planName = product.name;
    logStep("Retrieved product details", { planName });

    // Find matching plan in database
    const { data: plan } = await supabaseClient
      .from("plans")
      .select("id")
      .or(`stripe_product_id.eq.${productId},stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
      .single();

    // Upsert subscription in local database
    const subscriptionData = {
      user_id: user.id,
      plan_id: plan?.id || null,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseClient
      .from("subscriptions")
      .upsert(subscriptionData, {
        onConflict: "user_id",
      });

    if (upsertError) {
      logStep("Warning: Failed to sync subscription to database", { error: upsertError.message });
    } else {
      logStep("Subscription synced to database");
    }

    return new Response(
      JSON.stringify({
        subscribed: true,
        product_id: productId,
        price_id: priceId,
        plan_name: planName,
        subscription_end: subscriptionEnd,
        status: status,
        plan_id: plan?.id || null,
        cancel_at_period_end: cancelAtPeriodEnd,
        cancel_at: cancelAt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
