
-- Full wipe of Demo agent memory
-- Delete in order respecting foreign key constraints

DELETE FROM messages 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE agent_id = '0195252e-4c1d-7889-b574-245118a26498'
);

DELETE FROM conversation_takeovers 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE agent_id = '0195252e-4c1d-7889-b574-245118a26498'
);

DELETE FROM conversation_ratings 
WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE agent_id = '0195252e-4c1d-7889-b574-245118a26498'
);

DELETE FROM conversations 
WHERE agent_id = '0195252e-4c1d-7889-b574-245118a26498';

DELETE FROM response_cache 
WHERE agent_id = '0195252e-4c1d-7889-b574-245118a26498';

DELETE FROM query_embedding_cache 
WHERE agent_id = '0195252e-4c1d-7889-b574-245118a26498';
