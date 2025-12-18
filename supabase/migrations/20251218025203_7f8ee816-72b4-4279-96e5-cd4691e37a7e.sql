-- Delete orphaned anonymous conversation and its messages
DELETE FROM messages WHERE conversation_id = 'cd65d397-453c-4417-941f-ffbcd6f48637';
DELETE FROM conversations WHERE id = 'cd65d397-453c-4417-941f-ffbcd6f48637';