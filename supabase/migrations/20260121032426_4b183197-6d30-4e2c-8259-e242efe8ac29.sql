-- Update get_account_owner_id to check for active impersonation sessions first
CREATE OR REPLACE FUNCTION public.get_account_owner_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    -- Priority 1: Check for active impersonation session (super admins only)
    -- Session must be active and started within the last 30 minutes
    (
      SELECT target_user_id 
      FROM impersonation_sessions 
      WHERE admin_user_id = auth.uid() 
        AND is_active = true
        AND started_at > now() - interval '30 minutes'
      ORDER BY started_at DESC
      LIMIT 1
    ),
    -- Priority 2: Normal logic - own ID if subscription owner
    CASE 
      WHEN EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid()) 
      THEN auth.uid()
      -- Priority 3: Team member - return owner's ID
      ELSE (SELECT owner_id FROM team_members WHERE member_id = auth.uid() LIMIT 1)
    END
  )
$function$;