-- Create conversation_ratings table
CREATE TABLE public.conversation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('team_closed', 'ai_marked_complete')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_ratings ENABLE ROW LEVEL SECURITY;

-- Widget users can insert ratings for their conversations
CREATE POLICY "Anyone can submit ratings for active conversations"
ON public.conversation_ratings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_ratings.conversation_id
  )
);

-- Authenticated users can view ratings for accessible conversations
CREATE POLICY "Users can view ratings for accessible conversations"
ON public.conversation_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_ratings.conversation_id
    AND has_account_access(c.user_id)
  )
);

-- Create index for faster lookups
CREATE INDEX idx_conversation_ratings_conversation_id ON public.conversation_ratings(conversation_id);
CREATE INDEX idx_conversation_ratings_created_at ON public.conversation_ratings(created_at DESC);