-- Enable REPLICA IDENTITY FULL for messages table to capture complete row data
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Also enable for conversations table to sync status changes
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;