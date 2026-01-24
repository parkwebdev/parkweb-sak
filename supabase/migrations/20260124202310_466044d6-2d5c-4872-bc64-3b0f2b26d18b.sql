-- Update Starter plan with Stripe price IDs
UPDATE plans SET 
  stripe_product_id = 'prod_TqvCbNQDBGYpDy',
  stripe_price_id_monthly = 'price_1StDMCBDyAhjBgvJ3yi3cKlU',
  stripe_price_id_yearly = 'price_1StDMEBDyAhjBgvJrYyiJ7Zf',
  updated_at = now()
WHERE name = 'Starter';

-- Update Business plan with Stripe price IDs
UPDATE plans SET 
  stripe_product_id = 'prod_TqvCPvn1OkKlLL',
  stripe_price_id_monthly = 'price_1StDMFBDyAhjBgvJ60vumREn',
  stripe_price_id_yearly = 'price_1StDMGBDyAhjBgvJfAnhvxf8',
  updated_at = now()
WHERE name = 'Business';

-- Update Enterprise plan with Stripe price IDs
UPDATE plans SET 
  stripe_product_id = 'prod_TqvCr8uEaFhViW',
  stripe_price_id_monthly = 'price_1StDMHBDyAhjBgvJMLPQ4lST',
  stripe_price_id_yearly = 'price_1StDMIBDyAhjBgvJLqAaSMn5',
  updated_at = now()
WHERE name = 'Enterprise';