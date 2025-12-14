-- Add unique constraint to enforce single agent per user
ALTER TABLE agents ADD CONSTRAINT agents_user_id_unique UNIQUE (user_id);

-- Rename existing agent to Ari
UPDATE agents SET name = 'Ari' WHERE name != 'Ari';