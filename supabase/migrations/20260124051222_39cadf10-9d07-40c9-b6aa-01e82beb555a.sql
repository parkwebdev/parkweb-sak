-- Add Stripe identifiers to plans table for linking to Stripe products/prices
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly TEXT;

-- Index for faster lookups by Stripe product ID
CREATE INDEX IF NOT EXISTS idx_plans_stripe_product ON public.plans(stripe_product_id);

-- Add comment for documentation
COMMENT ON COLUMN public.plans.stripe_product_id IS 'Stripe Product ID for this plan';
COMMENT ON COLUMN public.plans.stripe_price_id_monthly IS 'Stripe Price ID for monthly billing';
COMMENT ON COLUMN public.plans.stripe_price_id_yearly IS 'Stripe Price ID for yearly billing';