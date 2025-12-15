-- Phase 1: Tool Result Persistence
-- Add tool-specific columns to messages table for storing tool calls and results

-- Add tool_call_id column for linking tool results back to their calls
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_call_id TEXT;

-- Add tool_name column for quick filtering
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_name TEXT;

-- Add tool_arguments column for storing the tool call arguments
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_arguments JSONB;

-- Add tool_result column for storing structured tool results
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_result JSONB;

-- Index for efficient tool history queries and linking calls to results
CREATE INDEX IF NOT EXISTS idx_messages_tool_call_id ON messages(tool_call_id) WHERE tool_call_id IS NOT NULL;

-- Index for finding tool messages by name (useful for redundant call prevention)
CREATE INDEX IF NOT EXISTS idx_messages_tool_name ON messages(tool_name) WHERE tool_name IS NOT NULL;

-- Add conversation_summary column to conversations metadata type hint
COMMENT ON TABLE messages IS 'Chat messages with tool call/result persistence for AI memory architecture';