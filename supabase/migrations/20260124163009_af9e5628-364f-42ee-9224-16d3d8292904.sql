-- Clean up API key permissions from existing user_roles
UPDATE user_roles 
SET permissions = array_remove(array_remove(permissions::text[], 'view_api_keys'), 'manage_api_keys')::public.app_permission[]
WHERE 'view_api_keys' = ANY(permissions::text[]) OR 'manage_api_keys' = ANY(permissions::text[]);