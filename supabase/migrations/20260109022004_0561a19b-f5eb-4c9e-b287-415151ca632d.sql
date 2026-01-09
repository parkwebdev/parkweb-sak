-- Create triggers on calendar_events table for automation events
DROP TRIGGER IF EXISTS trigger_automation_calendar_events_insert ON public.calendar_events;
CREATE TRIGGER trigger_automation_calendar_events_insert
  AFTER INSERT ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

DROP TRIGGER IF EXISTS trigger_automation_calendar_events_update ON public.calendar_events;
CREATE TRIGGER trigger_automation_calendar_events_update
  AFTER UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

DROP TRIGGER IF EXISTS trigger_automation_calendar_events_delete ON public.calendar_events;
CREATE TRIGGER trigger_automation_calendar_events_delete
  AFTER DELETE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

-- Add DELETE triggers for existing tables
DROP TRIGGER IF EXISTS trigger_automation_leads_delete ON public.leads;
CREATE TRIGGER trigger_automation_leads_delete
  AFTER DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();

DROP TRIGGER IF EXISTS trigger_automation_conversations_delete ON public.conversations;
CREATE TRIGGER trigger_automation_conversations_delete
  AFTER DELETE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_automation_event();