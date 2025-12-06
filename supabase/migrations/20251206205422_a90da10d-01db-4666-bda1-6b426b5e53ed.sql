-- Delete all conversation-related data for fresh testing
-- Order respects foreign key constraints

DELETE FROM messages;
DELETE FROM conversation_takeovers;
DELETE FROM leads;
DELETE FROM conversations;