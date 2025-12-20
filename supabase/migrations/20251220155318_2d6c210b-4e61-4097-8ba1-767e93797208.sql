-- Clear all conversation-related data for fresh testing
DELETE FROM messages WHERE TRUE;
DELETE FROM conversation_ratings WHERE TRUE;
DELETE FROM conversation_takeovers WHERE TRUE;
DELETE FROM conversation_memories WHERE TRUE;
DELETE FROM calendar_events WHERE conversation_id IS NOT NULL;
DELETE FROM conversations WHERE TRUE;
DELETE FROM leads WHERE TRUE;