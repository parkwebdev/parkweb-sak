-- Clean up orphaned conversation_memories (lead was deleted but memories remain)
DELETE FROM conversation_memories 
WHERE lead_id IS NOT NULL 
AND lead_id NOT IN (SELECT id FROM leads);

-- Clean up orphaned conversation_memories (conversation was deleted but memories remain)
DELETE FROM conversation_memories 
WHERE conversation_id IS NOT NULL 
AND conversation_id NOT IN (SELECT id FROM conversations);

-- Clean up orphaned calendar_events pointing to deleted leads
UPDATE calendar_events 
SET lead_id = NULL 
WHERE lead_id IS NOT NULL 
AND lead_id NOT IN (SELECT id FROM leads);

-- Clean up orphaned calendar_events pointing to deleted conversations
UPDATE calendar_events 
SET conversation_id = NULL 
WHERE conversation_id IS NOT NULL 
AND conversation_id NOT IN (SELECT id FROM conversations);

-- Clean up orphaned conversation_ratings
DELETE FROM conversation_ratings 
WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- Clean up orphaned conversation_takeovers
DELETE FROM conversation_takeovers 
WHERE conversation_id NOT IN (SELECT id FROM conversations);