-- Remove jacob@example.com user (user_id: 22222222-2222-2222-2222-222222222222)
DELETE FROM profiles WHERE user_id = '22222222-2222-2222-2222-222222222222';

-- Update aaron@example.com to aaron@park-web.com
UPDATE profiles 
SET email = 'aaron@park-web.com' 
WHERE user_id = 'cfdcde65-d8cc-45c3-8512-1155ceb041da';