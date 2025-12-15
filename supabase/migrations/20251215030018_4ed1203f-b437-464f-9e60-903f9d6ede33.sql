-- Add wordpress_community_term_id column to locations table
-- This stores the taxonomy term ID which homes reference via home_community[]
-- (distinct from wordpress_community_id which is the post ID)
ALTER TABLE public.locations
ADD COLUMN wordpress_community_term_id integer;