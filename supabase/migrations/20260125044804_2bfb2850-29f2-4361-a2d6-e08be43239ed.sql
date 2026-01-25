-- Delete stale push subscriptions created with mismatched VAPID keys
DELETE FROM push_subscriptions 
WHERE user_id = 'cfdcde65-d8cc-45c3-8512-1155ceb041da';