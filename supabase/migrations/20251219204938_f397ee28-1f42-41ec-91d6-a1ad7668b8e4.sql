-- =============================================================================
-- Add missing webhook triggers for calendar_events and properties tables
-- =============================================================================

-- Trigger for calendar_events table (booking events)
CREATE TRIGGER webhook_calendar_events_trigger
  AFTER INSERT OR UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_webhook_on_table_event();

-- Trigger for properties table (property listing events)
CREATE TRIGGER webhook_properties_trigger
  AFTER INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_webhook_on_table_event();