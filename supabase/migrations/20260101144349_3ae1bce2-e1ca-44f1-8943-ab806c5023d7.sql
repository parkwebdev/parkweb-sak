-- Convert any existing super_admin customer accounts to admin
-- (super_admin will be reserved for internal platform use only)
UPDATE user_roles 
SET role = 'admin'::app_role 
WHERE role = 'super_admin'::app_role;

-- Convert any existing client roles to member
UPDATE user_roles 
SET role = 'member'::app_role 
WHERE role = 'client'::app_role;