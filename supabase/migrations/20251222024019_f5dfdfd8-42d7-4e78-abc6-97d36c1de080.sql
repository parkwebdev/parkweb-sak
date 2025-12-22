-- Add kanban_order column to leads table for persisting drag-and-drop order
ALTER TABLE leads ADD COLUMN kanban_order integer;

-- Initialize kanban_order based on current order (newest first gets lowest order number)
-- This ensures existing leads have proper ordering within each status column
WITH ordered_leads AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, status ORDER BY created_at DESC) as rn
  FROM leads
)
UPDATE leads SET kanban_order = ordered_leads.rn
FROM ordered_leads WHERE leads.id = ordered_leads.id;