-- Create unique constraint on email and user_id for CSV upsert functionality
ALTER TABLE public.clients 
ADD CONSTRAINT unique_client_email_per_user 
UNIQUE (email, user_id);