-- Phase 1: Lock down plans table to super_admin only for mutations
-- Drop existing broken policy
DROP POLICY IF EXISTS "Pilot team with revenue permission can manage plans" ON plans;

-- Create super_admin-only policy for INSERT/UPDATE/DELETE
CREATE POLICY "Only super admins can manage plans"
ON plans FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Keep read access for view_revenue permission (existing policy should remain)
-- Phase 2: Remove max_agents from all existing plans
UPDATE plans 
SET limits = COALESCE(limits, '{}'::jsonb) - 'max_agents' - 'agents';