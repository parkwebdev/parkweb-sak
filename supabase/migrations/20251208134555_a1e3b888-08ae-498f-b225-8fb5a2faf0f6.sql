-- Delete all messages first (foreign key constraint)
DELETE FROM messages;

-- Delete all leads
DELETE FROM leads;

-- Delete all conversations
DELETE FROM conversations;

-- Delete all conversation takeovers
DELETE FROM conversation_takeovers;