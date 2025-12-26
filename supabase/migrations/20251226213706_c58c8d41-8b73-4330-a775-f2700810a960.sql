-- Drop orphaned database functions that reference non-existent tables
-- These functions reference tables that no longer exist: custom_domains, client_folders, onboarding_tokens

-- Function for custom_domains table (table doesn't exist)
DROP FUNCTION IF EXISTS public.ensure_single_primary_domain() CASCADE;

-- Function for client_folders table (table doesn't exist)
DROP FUNCTION IF EXISTS public.update_client_folders_updated_at() CASCADE;

-- Functions for onboarding_tokens table (table doesn't exist)
DROP FUNCTION IF EXISTS public.validate_anonymous_submission() CASCADE;
DROP FUNCTION IF EXISTS public.mark_token_used(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_onboarding_token(text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_submission_token(text) CASCADE;