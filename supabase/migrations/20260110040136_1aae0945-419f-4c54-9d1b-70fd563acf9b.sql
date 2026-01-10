-- Phase 1: Complete Flow Builder Database Cleanup (Final)

-- Drop all automation-related triggers on leads
DROP TRIGGER IF EXISTS trigger_automation_leads_insert ON leads;
DROP TRIGGER IF EXISTS trigger_automation_leads_update ON leads;
DROP TRIGGER IF EXISTS trigger_automation_leads_delete ON leads;

-- Drop all automation-related triggers on conversations
DROP TRIGGER IF EXISTS trigger_automation_conversations_insert ON conversations;
DROP TRIGGER IF EXISTS trigger_automation_conversations_update ON conversations;
DROP TRIGGER IF EXISTS trigger_automation_conversations_delete ON conversations;

-- Drop all automation-related triggers on messages
DROP TRIGGER IF EXISTS trigger_automation_messages_insert ON messages;

-- Drop all automation-related triggers on calendar_events
DROP TRIGGER IF EXISTS trigger_automation_calendar_events_insert ON calendar_events;
DROP TRIGGER IF EXISTS trigger_automation_calendar_events_update ON calendar_events;
DROP TRIGGER IF EXISTS trigger_automation_calendar_events_delete ON calendar_events;

-- Drop the stats trigger (correct name)
DROP TRIGGER IF EXISTS trigger_update_automation_stats ON automation_executions;

-- Now drop functions with CASCADE to catch any remaining dependencies
DROP FUNCTION IF EXISTS dispatch_automation_event() CASCADE;
DROP FUNCTION IF EXISTS update_automation_stats() CASCADE;

-- Drop tables (cascade handles FK constraints)
DROP TABLE IF EXISTS automation_executions CASCADE;
DROP TABLE IF EXISTS automations CASCADE;

-- Drop enums
DROP TYPE IF EXISTS automation_status;
DROP TYPE IF EXISTS automation_trigger_type;