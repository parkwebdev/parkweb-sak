-- Add unlimited conversations to Advanced plan
UPDATE public.plans 
SET limits = limits || jsonb_build_object('max_conversations_per_month', -1)
WHERE name = 'Advanced';