
UPDATE knowledge_sources 
SET status = 'ready',
    content = 'Sitemap processed. 35 pages indexed successfully.',
    metadata = metadata || '{"completed_at": "2025-12-18T05:30:00.000Z", "remaining_count": 0}'::jsonb
WHERE id = '01b141be-556d-466a-8fed-bc3cd0b7e416';
