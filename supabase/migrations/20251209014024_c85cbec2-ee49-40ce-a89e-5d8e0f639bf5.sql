-- Delete all conversation-related data (respecting foreign key order)
DELETE FROM messages;
DELETE FROM conversation_takeovers;
DELETE FROM conversation_ratings;
DELETE FROM leads;
DELETE FROM conversations;