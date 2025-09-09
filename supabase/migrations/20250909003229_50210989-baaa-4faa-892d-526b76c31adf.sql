-- Update sample data to use current authenticated user ID
UPDATE public.requests 
SET user_id = 'cfdcde65-d8cc-45c3-8512-1155ceb041da'::uuid,
    assigned_to = 'cfdcde65-d8cc-45c3-8512-1155ceb041da'::uuid
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid;